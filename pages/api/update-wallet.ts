import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @deprecated This endpoint is deprecated. Use /api/verify-wallet instead.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return immediate deprecation notice
  res.setHeader('Warning', '299 - This endpoint is deprecated. Please use /api/verify-wallet instead');
  return res.status(410).json({ 
    error: 'This endpoint is deprecated',
    message: 'Please use /api/verify-wallet instead',
    type: 'DEPRECATED_ENDPOINT'
  });
} 