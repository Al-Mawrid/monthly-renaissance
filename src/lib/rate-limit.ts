// In-memory sliding-window rate limiter.
//
// Hostinger serves this app from a single long-lived Passenger/Node process,
// so process-local state is shared across requests and this is sufficient for
// light abuse protection. Caveat: if the app is ever scaled to multiple
// processes/instances, each gets its own window and the effective limit
// multiplies — move to a shared store (DB/Redis) before that happens.

type Window = number[]; // sorted-ish list of request timestamps (ms)

const buckets = new Map<string, Window>();

// Opportunistic cleanup so the map does not grow unbounded for one-off keys.
let lastSweep = 0;

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now > t && now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const { max, windowMs } = opts;
  const now = Date.now();
  sweep(now, windowMs);

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    const oldest = hits[0];
    return { ok: false, remaining: 0, retryAfterMs: windowMs - (now - oldest) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: max - hits.length, retryAfterMs: 0 };
}
