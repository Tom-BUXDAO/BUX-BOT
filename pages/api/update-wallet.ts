import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('Creating wallet connection:', { userId, address });

    try {
      // Create wallet connection first
      await prisma.userWallet.create({
        data: {
          address,
          userId
        }
      });
      console.log('Wallet connection created');
    } catch (error: any) {
      // Handle duplicate wallet error
      if (error.code === 'P2002') {
        console.log('Wallet already exists, updating owner');
        await prisma.userWallet.update({
          where: { address },
          data: { userId }
        });
      } else {
        throw error;
      }
    }

    // Run verification after wallet is connected
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    // Update NFT ownership
    await prisma.nFT.updateMany({
      where: { ownerWallet: address },
      data: { ownerDiscordId: user.discordId }
    });

    // Update token balance ownership
    await prisma.tokenBalance.updateMany({
      where: { walletAddress: address },
      data: { ownerDiscordId: user.discordId }
    });

    console.log('Running verification');
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);
    
    return res.status(200).json({ 
      success: true,
      verification: verificationResult 
    });

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 