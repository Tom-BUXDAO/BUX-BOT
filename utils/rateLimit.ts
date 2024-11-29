import rateLimit from 'express-rate-limit';
import { NextApiResponse } from 'next';

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

export const createRateLimit = (config: RateLimitConfig) => {
  const limiter = new Map();
  
  return {
    check: async (res: NextApiResponse, limit: number, token: string) => {
      const now = Date.now();
      const windowStart = now - config.interval;
      
      const tokenCount = limiter.get(token) || [];
      const validRequests = tokenCount.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= limit) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return false;
      }
      
      validRequests.push(now);
      limiter.set(token, validRequests);
      
      // Cleanup old entries
      if (limiter.size > config.uniqueTokenPerInterval) {
        const oldestToken = [...limiter.keys()][0];
        limiter.delete(oldestToken);
      }
      
      return true;
    }
  };
}; 