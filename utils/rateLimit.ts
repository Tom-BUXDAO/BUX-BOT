import { NextApiResponse } from 'next';

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitStore {
  [key: string]: {
    timestamps: number[];
    lastCleanup: number;
  };
}

export const createRateLimit = (config: RateLimitConfig) => {
  const store: RateLimitStore = {};

  const cleanup = (token: string, now: number) => {
    const data = store[token];
    if (!data) return;

    // Only cleanup once per interval
    if (now - data.lastCleanup < config.interval) return;

    const windowStart = now - config.interval;
    data.timestamps = data.timestamps.filter(ts => ts > windowStart);
    data.lastCleanup = now;

    // Remove empty entries
    if (data.timestamps.length === 0) {
      delete store[token];
    }
  };

  return {
    check: async (res: NextApiResponse, limit: number, token: string): Promise<boolean> => {
      const now = Date.now();

      // Initialize or get token data
      if (!store[token]) {
        store[token] = {
          timestamps: [],
          lastCleanup: now
        };
      }

      // Clean up old timestamps
      cleanup(token, now);

      const data = store[token];
      if (!data) return true;

      // Check limit
      if (data.timestamps.length >= limit) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((data.timestamps[0] + config.interval - now) / 1000)
        });
        return false;
      }

      // Add new timestamp
      data.timestamps.push(now);
      return true;
    }
  };
}; 