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
  // Increase timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30');

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
    // Add timeout to verifyHolder
    const verifyPromise = verifyHolder(walletAddress);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Verification timed out')), 25000)
    );

    const { isHolder, collections } = await Promise.race([
      verifyPromise,
      timeoutPromise
    ]);

    const user = await prisma.user.update({
      where: { discordId: token.discordId as string },
      data: { walletAddress, updatedAt: new Date() },
    });

    const assignedRoles = await updateDiscordRoles(token.discordId as string, collections, walletAddress);

    return res.status(200).json({
      ...user,
      isHolder,
      collections,
      assignedRoles
    });
  } catch (err) {
    console.error('Error updating wallet address:', err);
    return res.status(500).json({ 
      message: err instanceof Error ? err.message : 'Error updating wallet address'
    });
  }
} 