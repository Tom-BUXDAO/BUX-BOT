import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Collection symbol is required' });
    }

    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`);
    const data = await response.json();

    return res.status(200).json({ floorPrice: data.floorPrice / 1e9 });
  } catch (error) {
    console.error('Error fetching floor price:', error);
    return res.status(500).json({ error: 'Failed to fetch floor price' });
  }
} 