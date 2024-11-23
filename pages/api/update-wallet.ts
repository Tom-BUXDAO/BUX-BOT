import { prisma } from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyHolder } from '../../utils/verifyHolder';
import { updateDiscordRoles } from '../../utils/discordRoles';

interface ErrorResponse {
  message: string;
  token?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
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

    // Update Discord roles
    await updateDiscordRoles(token.discordId as string, collections);

    return res.status(200).json({
      ...user,
      isHolder,
      collections
    });
  } catch (err) {
    console.error('Error updating wallet address:', err);
    const response: ErrorResponse = {
      message: 'Error updating wallet address',
      token
    };
    return res.status(500).json(response);
  }
} 