import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Initialize Redis client
export const redis = new Redis({
  url: process.env.KV_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Create a new ratelimiter instance
// Allow 5 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10s"),
  analytics: true,
  /**
   * Optional: A key prefix for the ratelimit keys in Redis.
   * Can be used to organize your Redis keys.
   */
  prefix: "@upstash/ratelimit",
})
