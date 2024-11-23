import { prisma } from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyHolder } from '../../utils/verifyHolder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = await getToken({ req });
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  try {
    // Verify holder status
    const { isHolder, collections } = await verifyHolder(walletAddress);

    const user = await prisma.user.update({
      where: {
        discordId: token.discordId as string,
      },
      data: {
        walletAddress,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      ...user,
      isHolder,
      collections
    });
  } catch (error) {
    console.error('Error updating wallet address:', error);
    return res.status(500).json({ 
      message: 'Error updating wallet address'
    });
  }
} 