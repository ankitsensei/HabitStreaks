import { getHabits, getHabitsMeta } from "./api";
import type { HabitMeta, HabitWithCompletions } from "./api";

// Hand-rolled shared cache for /api/habits responses.
//
// Every page used to fetch for itself (Statistics even kept a component-local
// Map), so walking Habits → Statistics → Habits fired the same request three
// times. All of them now read through this module-level cache, which:
//
//   * keys entries by the requested date range *and* the requested field
//     mode, so a metadata-only answer can never be served to a page that
//     renders the heatmap,
//   * serves an entry for ~30 seconds without touching the network,
//   * deduplicates concurrent requests for one key through a single
//     in-flight promise,
//   * only aborts an in-flight request once every caller has cancelled it,
//     so one page navigating away never kills a download another page is
//     still waiting on.
const TTL_MS = 30_000;

/** `full` = habit rows + completion dates, `meta` = rows + a check-in count. */
type HabitsFields = "full" | "meta";

interface CacheEntry {
  fields: HabitsFields;
  /**
   * The payload for `fields` — `HabitWithCompletions[]` for full entries,
   * `HabitMeta[]` for meta ones. Kept untyped here because the core fetcher
   * is generic; peek() narrows it with the `fields` discriminator, so the two
   * shapes can never be handed to the wrong caller.
   */
  data: unknown;
  fetchedAt: number;
}

interface InFlight {
  promise: Promise<unknown>;
  controller: AbortController;
  /** Callers still relying on this request — see fetchCached. */
  waiters: number;
  /** Set once the request has been aborted for lack of waiters. */
  aborted: boolean;
}

// Bumped by invalidateHabits() so a request that started before a mutation
// can never write its (now stale) response back into the cache.
let generation = 0;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, InFlight>();

/**
 * Reserved key for a dataset assembled on the client instead of fetched in
 * one call — Statistics merges its all-time history from per-year chunks.
 * Range keys always contain a colon, so it can never collide with one.
 */
export const OVERALL_HABITS_KEY = "overall";

/**
 * Cache key for a date range: the `from`/`to` pair, both YYYY-MM-DD. Meta
 * requests live in their own namespace, so the two modes can never hand each
 * other's payload to a caller.
 */
export const habitsCacheKey = (
  from: string,
  to: string,
  fields: HabitsFields = "full",
): string => (fields === "full" ? `${from}:${to}` : `${from}:${to}:meta`);

const peek = <T>(key: string, fields: HabitsFields): T[] | null => {
  const entry = cache.get(key);

  return entry?.fields === fields ? (entry.data as T[]) : null;
};

/** The full habits we last stored for a key, or null if never fetched. */
export const peekHabits = (key: string): HabitWithCompletions[] | null =>
  peek<HabitWithCompletions>(key, "full");

/** The metadata-only habits we last stored for a key, or null if never fetched. */
export const peekHabitsMeta = (key: string): HabitMeta[] | null =>
  peek<HabitMeta>(key, "meta");

/** True when an entry exists and is younger than the TTL. */
export const isHabitsCacheFresh = (key: string): boolean => {
  const entry = cache.get(key);

  return entry !== undefined && Date.now() - entry.fetchedAt < TTL_MS;
};

/**
 * Runs `request` through the cache for `key`, reusing any request already in
 * flight for that key and caching the result for TTL_MS. Concurrent callers
 * share one promise, so two pages mounting at the same moment still produce a
 * single request. Failures are never cached, so a retry starts a fresh one.
 *
 * Each caller registers as a waiter and releases that claim when its signal
 * aborts or its promise settles, whichever happens first. The underlying
 * fetch is aborted only when the last waiter is gone: a caller without a
 * signal never cancels, so it keeps the shared request alive until it
 * completes on its own.
 */
const fetchCached = <T>(
  key: string,
  fields: HabitsFields,
  request: (signal: AbortSignal) => Promise<T[]>,
  signal?: AbortSignal,
): Promise<T[]> => {
  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }

  let flight = inFlight.get(key);

  if (!flight || flight.aborted) {
    const controller = new AbortController();
    const requestGeneration = generation;

    const promise: Promise<unknown> = request(controller.signal)
      .then((data) => {
        if (requestGeneration === generation) {
          cache.set(key, { fields, data, fetchedAt: Date.now() });
        }

        return data;
      })
      .finally(() => {
        // Only clear our own entry: invalidateHabits() may already have
        // replaced it with a newer request for the same key.
        if (inFlight.get(key)?.controller === controller) {
          inFlight.delete(key);
        }
      });

    flight = { promise, controller, waiters: 0, aborted: false };
    inFlight.set(key, flight);
  }

  const active = flight;
  active.waiters += 1;

  let released = false;
  const release = () => {
    if (released) {
      return;
    }

    released = true;
    active.waiters -= 1;

    // Nobody wants this answer anymore, so stop downloading it. The entry is
    // dropped immediately: a caller arriving now must start a fresh request
    // rather than join one that is about to reject.
    if (active.waiters === 0 && !active.aborted) {
      active.aborted = true;
      active.controller.abort();

      if (inFlight.get(key) === active) {
        inFlight.delete(key);
      }
    }
  };

  // Wrap the shared promise so a caller can reject early on its own abort,
  // even while other waiters keep the shared request running.
  return new Promise<T[]>((resolve, reject) => {
    const onAbort = () => {
      release();
      reject(signal?.reason);
    };

    active.promise.then(
      (data) => {
        signal?.removeEventListener("abort", onAbort);
        release();
        resolve(data as T[]);
      },
      (err) => {
        signal?.removeEventListener("abort", onAbort);
        release();
        reject(err);
      },
    );

    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

/** A date range with completion history — what the heatmap and statistics need. */
export const fetchHabits = (
  token: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<HabitWithCompletions[]> =>
  fetchCached(
    habitsCacheKey(from, to),
    "full",
    (requestSignal) =>
      getHabits(token, from, to, requestSignal).then(
        (result) => result.habits,
      ),
    signal,
  );

/** A date range as metadata plus a check-in count — enough for the Manage list. */
export const fetchHabitsMeta = (
  token: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<HabitMeta[]> =>
  fetchCached(
    habitsCacheKey(from, to, "meta"),
    "meta",
    (requestSignal) =>
      getHabitsMeta(token, from, to, requestSignal).then(
        (result) => result.habits,
      ),
    signal,
  );

/**
 * Stores a dataset assembled on the client — Statistics merges its all-time
 * history from per-year chunks — under `key`, with the same TTL and
 * deduplication as a plain range fetch, so revisiting the page reuses the
 * merged list instead of re-downloading every chunk.
 */
export const fetchDerivedHabits = (
  key: string,
  load: (signal: AbortSignal) => Promise<HabitWithCompletions[]>,
  signal?: AbortSignal,
): Promise<HabitWithCompletions[]> => fetchCached(key, "full", load, signal);

/**
 * Drops one key — or, with no key, the whole cache — after a mutation, so the
 * next visit refetches instead of serving pre-mutation data.
 */
export const invalidateHabits = (key?: string): void => {
  generation += 1;

  if (key === undefined) {
    cache.clear();
    inFlight.clear();
    return;
  }

  cache.delete(key);
  inFlight.delete(key);
};
