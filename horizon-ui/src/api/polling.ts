// The server caches each version for this long, so asking more often could
// only get the same answer. The library's is cached per user for a second, the
// public one for everyone for three.
export const LIBRARY_POLL_MS = 1_000;
export const PUBLIC_POLL_MS = 3_000;

// A server that can't be reached is asked less often until it answers.
export const POLL_AFTER_FAILURE_MS = 30_000;
