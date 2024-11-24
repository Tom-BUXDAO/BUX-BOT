import { prisma } from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyHolder } from '../../utils/verifyHolder';
import { updateDiscordRoles } from '../../utils/discordRoles';

interface ErrorResponse {
  message: string;
  error?: any;
}

interface VerifyResponse {
  isHolder: boolean;
  collections: { name: string; count: number; }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  // Increase timeout
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60');

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
    console.log('Starting wallet verification for:', walletAddress);

    // Add timeout to verifyHolder
    const verifyPromise = verifyHolder(walletAddress);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Verification timed out')), 50000)
    );

    const verifyResult = await Promise.race<VerifyResponse>([
      verifyPromise,
      timeoutPromise
    ]);

    console.log('Verify result:', verifyResult);

    const user = await prisma.user.update({
      where: { discordId: token.discordId as string },
      data: { walletAddress, updatedAt: new Date() },
    });

    console.log('User updated:', user);

    const assignedRoles = await updateDiscordRoles(token.discordId as string, verifyResult.collections, walletAddress);

    console.log('Roles assigned:', assignedRoles);

    return res.status(200).json({
      ...user,
      isHolder: verifyResult.isHolder,
      collections: verifyResult.collections,
      assignedRoles
    });
  } catch (err) {
    console.error('Detailed error:', err);
    const errorResponse: ErrorResponse = {
      message: err instanceof Error ? err.message : 'Error updating wallet address',
      error: err
    };
    return res.status(500).json(errorResponse);
  }
} 