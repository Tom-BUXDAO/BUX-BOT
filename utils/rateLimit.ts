interface RateLimit {
  count: number;
  firstRequest: number;
}

class RateLimiter {
  private limits: Map<string, RateLimit>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor() {
    this.limits = new Map();
    this.windowMs = 60 * 1000; // 1 minute
    this.maxRequests = 5; // 5 requests per minute
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.limits.get(identifier);

    if (!limit) {
      // First request
      this.limits.set(identifier, { count: 1, firstRequest: now });
      return true;
    }

    if (now - limit.firstRequest > this.windowMs) {
      // Window expired, reset
      this.limits.set(identifier, { count: 1, firstRequest: now });
      return true;
    }

    if (limit.count >= this.maxRequests) {
      return false;
    }

    // Increment counter
    limit.count++;
    this.limits.set(identifier, limit);
    return true;
  }

  async clearLimit(identifier: string): Promise<void> {
    this.limits.delete(identifier);
  }

  // Clean up old entries periodically
  private cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now - limit.firstRequest > this.windowMs) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimit = new RateLimiter();

// Run cleanup every minute
setInterval(() => {
  rateLimit['cleanup']();
}, 60 * 1000); 