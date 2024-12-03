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

    console.log('Connecting wallet:', { userId, address });

    // Check if wallet exists
    const existingWallet = await prisma.userWallet.findUnique({
      where: { address }
    });

    if (existingWallet) {
      if (existingWallet.userId !== userId) {
        return res.status(400).json({ error: 'Wallet already connected to another user' });
      }
      console.log('Wallet already connected to this user');
    } else {
      // Create new wallet connection
      await prisma.userWallet.create({
        data: {
          address,
          userId
        }
      });
      console.log('Created new wallet connection');
    }

    // Get user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    console.log('Updating ownership records for:', { address, discordId: user.discordId });

    // Update NFT ownership
    const nftResult = await prisma.nFT.updateMany({
      where: { ownerWallet: address },
      data: { ownerDiscordId: user.discordId }
    });
    console.log(`Updated ${nftResult.count} NFTs`);

    // Update token balance ownership
    const balanceResult = await prisma.tokenBalance.updateMany({
      where: { walletAddress: address },
      data: { ownerDiscordId: user.discordId }
    });
    console.log(`Updated ${balanceResult.count} token balances`);

    // Run verification
    console.log('Running verification');
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);
    
    return res.status(200).json({ 
      success: true,
      nfts: nftResult.count,
      balances: balanceResult.count,
      verification: verificationResult 
    });

  } catch (error: any) {
    console.error('Error in update-wallet:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 