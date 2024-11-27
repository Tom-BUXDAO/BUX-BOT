interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const defaultConfig: RateLimitConfig = {
    maxRequests: 100, // Maximum requests per window
    windowMs: 60000   // Window size in milliseconds (1 minute)
};

class RateLimiter {
    private timestamps: number[] = [];
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig = defaultConfig) {
        this.config = config;
    }

    async check(): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Remove old timestamps
        this.timestamps = this.timestamps.filter(ts => ts > windowStart);

        // Check if we're over the limit
        if (this.timestamps.length >= this.config.maxRequests) {
            return false;
        }

        // Add new timestamp
        this.timestamps.push(now);
        return true;
    }

    async wait(): Promise<void> {
        while (!(await this.check())) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

const globalLimiter = new RateLimiter();

export async function rateLimit(): Promise<void> {
    await globalLimiter.wait();
} 