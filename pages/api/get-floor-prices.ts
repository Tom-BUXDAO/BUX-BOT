import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'express-rate-limit';

// Cache floor prices for 5 minutes
const cache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limit to 10 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BUX DAO NFT Bot'
      },
      timeout: 5000 // 5 second timeout
    });

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