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

    console.log('\n=== Starting Wallet Connection Process ===');
    console.log(`User ID: ${userId}`);
    console.log(`Wallet Address: ${address}`);

    // Get user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    console.log(`Discord ID: ${user.discordId}`);

    // First, create the wallet connection
    const wallet = await prisma.userWallet.create({
      data: {
        address: address,
        userId: userId
      }
    });
    console.log('Created wallet connection:', wallet);

    // Now update NFTs and token balance
    const [nftResult, tokenResult] = await Promise.all([
      // Update NFT ownership
      prisma.nFT.updateMany({
        where: { ownerWallet: address },
        data: { ownerDiscordId: user.discordId }
      }),
      // Update token balance
      prisma.tokenBalance.updateMany({
        where: { walletAddress: address },
        data: { ownerDiscordId: user.discordId }
      })
    ]);

    console.log('Update results:', {
      nfts: nftResult,
      tokenBalance: tokenResult
    });

    // Verify the updates
    const [updatedNFTs, updatedBalance] = await Promise.all([
      prisma.nFT.findMany({
        where: { ownerWallet: address }
      }),
      prisma.tokenBalance.findUnique({
        where: { walletAddress: address }
      })
    ]);

    console.log('Verification:', {
      nfts: updatedNFTs.length,
      balance: updatedBalance
    });

    // Run verification with updated data
    const verificationResult = await verifyHolder(address, user.discordId);

    return res.status(200).json({ success: true, verification: verificationResult });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 