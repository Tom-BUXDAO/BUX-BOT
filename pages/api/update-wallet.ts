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

    // Check if wallet already exists
    const existingWallet = await prisma.userWallet.findUnique({
      where: { address }
    });

    if (existingWallet) {
      console.log('Wallet already exists:', existingWallet);
      if (existingWallet.userId !== userId) {
        return res.status(400).json({ error: 'Wallet already connected to another user' });
      }
    } else {
      // Create new wallet connection
      try {
        const wallet = await prisma.userWallet.create({
          data: {
            address: address,
            userId: userId
          }
        });
        console.log('Created new wallet connection:', wallet);
      } catch (error) {
        console.error('Error creating wallet:', error);
        return res.status(500).json({ error: 'Failed to create wallet connection' });
      }
    }

    // Check existing NFTs and token balance
    const [existingNFTs, existingBalance] = await Promise.all([
      prisma.nFT.findMany({
        where: { ownerWallet: address }
      }),
      prisma.tokenBalance.findUnique({
        where: { walletAddress: address }
      })
    ]);

    console.log(`Found ${existingNFTs.length} NFTs:`, existingNFTs);
    console.log('Found token balance:', existingBalance);

    // Update NFTs and token balance in a transaction
    await prisma.$transaction(async (tx) => {
      if (existingNFTs.length > 0) {
        const nftResult = await tx.nFT.updateMany({
          where: { ownerWallet: address },
          data: { ownerDiscordId: user.discordId }
        });
        console.log(`Updated ${nftResult.count} NFTs with Discord ID ${user.discordId}`);
      }

      if (existingBalance) {
        const tokenResult = await tx.tokenBalance.update({
          where: { walletAddress: address },
          data: { ownerDiscordId: user.discordId }
        });
        console.log('Updated token balance:', tokenResult);
      }
    });

    // Verify the updates worked
    const [updatedNFTs, updatedBalance] = await Promise.all([
      prisma.nFT.findMany({
        where: { 
          ownerWallet: address,
          ownerDiscordId: user.discordId
        }
      }),
      prisma.tokenBalance.findUnique({
        where: { walletAddress: address }
      })
    ]);

    console.log('After updates:', {
      nfts: updatedNFTs.length,
      balance: updatedBalance
    });

    // Now run verification
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);

    return res.status(200).json({ 
      success: true, 
      nfts: updatedNFTs.length,
      balance: updatedBalance?.balance || 0,
      verification: verificationResult 
    });

  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 