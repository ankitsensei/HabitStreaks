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
//     in-flight promise.
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

// Bumped by invalidateHabits() so a request that started before a mutation
// can never write its (now stale) response back into the cache.
let generation = 0;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

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
 */
const fetchCached = <T>(
  key: string,
  fields: HabitsFields,
  request: () => Promise<T[]>,
): Promise<T[]> => {
  const pending = inFlight.get(key);

  if (pending) {
    return pending as Promise<T[]>;
  }

  const requestGeneration = generation;

  const promise = request()
    .then((data) => {
      if (requestGeneration === generation) {
        cache.set(key, { fields, data, fetchedAt: Date.now() });
      }

      return data;
    })
    .finally(() => {
      // Only clear our own entry: invalidateHabits() may already have
      // replaced it with a newer request for the same key.
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, promise);

  return promise;
};

/** A date range with completion history — what the heatmap and statistics need. */
export const fetchHabits = (
  token: string,
  from: string,
  to: string,
): Promise<HabitWithCompletions[]> =>
  fetchCached(habitsCacheKey(from, to), "full", () =>
    getHabits(token, from, to).then((result) => result.habits),
  );

/** A date range as metadata plus a check-in count — enough for the Manage list. */
export const fetchHabitsMeta = (
  token: string,
  from: string,
  to: string,
): Promise<HabitMeta[]> =>
  fetchCached(habitsCacheKey(from, to, "meta"), "meta", () =>
    getHabitsMeta(token, from, to).then((result) => result.habits),
  );

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
