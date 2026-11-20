import { getHabits } from "./api";
import type { HabitWithCompletions } from "./api";

// Hand-rolled shared cache for /api/habits responses.
//
// Every page used to fetch for itself (Statistics even kept a component-local
// Map), so walking Habits → Statistics → Habits fired the same request three
// times. All of them now read through this module-level cache, which:
//
//   * keys entries by the requested date range,
//   * serves an entry for ~30 seconds without touching the network,
//   * deduplicates concurrent requests for one range through a single
//     in-flight promise.
const TTL_MS = 30_000;

interface CacheEntry {
  data: HabitWithCompletions[];
  fetchedAt: number;
}

// Bumped by invalidateHabits() so a request that started before a mutation
// can never write its (now stale) response back into the cache.
let generation = 0;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<HabitWithCompletions[]>>();

/** Cache key for a date range: the `from`/`to` pair, both YYYY-MM-DD. */
export const habitsCacheKey = (from: string, to: string) => `${from}:${to}`;

/** The data we last stored for a range, however old, or null if never fetched. */
export const peekHabits = (key: string): HabitWithCompletions[] | null =>
  cache.get(key)?.data ?? null;

/** True when an entry exists and is younger than the TTL. */
export const isHabitsCacheFresh = (key: string): boolean => {
  const entry = cache.get(key);

  return entry !== undefined && Date.now() - entry.fetchedAt < TTL_MS;
};

/**
 * Fetches a date range, reusing any request already in flight for that range
 * and caching the result for TTL_MS. Concurrent callers share one promise, so
 * two pages mounting at the same moment still produce a single request.
 * Failures are never cached, so a retry starts a fresh request.
 */
export const fetchHabits = (
  token: string,
  from: string,
  to: string,
): Promise<HabitWithCompletions[]> => {
  const key = habitsCacheKey(from, to);
  const pending = inFlight.get(key);

  if (pending) {
    return pending;
  }

  const requestGeneration = generation;

  const promise = getHabits(token, from, to)
    .then((result) => {
      if (requestGeneration === generation) {
        cache.set(key, { data: result.habits, fetchedAt: Date.now() });
      }

      return result.habits;
    })
    .finally(() => {
      // Only clear our own entry: invalidateHabits() may already have
      // replaced it with a newer request for the same range.
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, promise);

  return promise;
};

/**
 * Drops one range — or, with no key, the whole cache — after a mutation, so
 * the next visit refetches instead of serving pre-mutation data.
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
