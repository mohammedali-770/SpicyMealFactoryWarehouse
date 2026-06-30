// Best-effort, in-memory, per-instance rate limiter. This is a guard-rail, NOT a
// security control (it resets on cold start and is not shared across instances).
// The real authorization gate is requireAdmin().
interface Bucket {
  count: number
  windowStart: number
}

const store = new Map<string, Bucket>()

export function rateLimit(key: string, limit = 20, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now()
  const bucket = store.get(key)
  if (!bucket || now - bucket.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}
