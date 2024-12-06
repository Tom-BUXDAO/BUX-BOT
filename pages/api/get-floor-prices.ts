import { NextApiRequest, NextApiResponse } from 'next';

// Cache floor prices for 5 minutes
const cache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requestData = requestCounts.get(ip);

  if (!requestData || now > requestData.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (requestData.count >= MAX_REQUESTS) {
    return true;
  }

  requestData.count++;
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (isRateLimited(clientIp as string)) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  try {
    const { symbol } = req.query;
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Collection symbol is required' });
    }

    // Check cache first
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({ floorPrice: cached.price });
    }

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BUX DAO NFT Bot'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Magic Eden API error: ${response.status}`);
    }

    const data = await response.json();
    const floorPrice = data.floorPrice / 1e9;

    // Update cache
    cache.set(symbol, {
      price: floorPrice,
      timestamp: Date.now()
    });

    return res.status(200).json({ floorPrice });
  } catch (error) {
    console.error('Error fetching floor price:', error);
    return res.status(500).json({ error: 'Failed to fetch floor price', details: error.message });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}; 