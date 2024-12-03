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
      select: { discordId: true, discordName: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    console.log(`Discord ID: ${user.discordId}`);
    console.log(`Discord Name: ${user.discordName}`);

    // First check what NFTs and balance exist for this wallet
    const existingNFTs = await prisma.nFT.findMany({
      where: { ownerWallet: address }
    });
    console.log(`Found ${existingNFTs.length} NFTs for wallet`);

    const existingBalance = await prisma.tokenBalance.findUnique({
      where: { walletAddress: address }
    });
    console.log('Current token balance:', existingBalance);

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, create or update the wallet connection
      const wallet = await tx.userWallet.upsert({
        where: { address },
        create: {
          address,
          userId,
        },
        update: {
          userId,
        },
      });
      console.log('Wallet connection created/updated:', wallet);

      // Update NFT ownership with Discord ID
      if (existingNFTs.length > 0) {
        const nftResult = await tx.nFT.updateMany({
          where: {
            ownerWallet: address
          },
          data: {
            ownerDiscordId: user.discordId
          }
        });
        console.log(`Updated ${nftResult.count} NFTs with Discord ID ${user.discordId}`);
      }

      // Update or create token balance with Discord ID
      const tokenResult = await tx.tokenBalance.upsert({
        where: { walletAddress: address },
        create: {
          walletAddress: address,
          ownerDiscordId: user.discordId,
          balance: existingBalance?.balance || BigInt(0),
          lastUpdated: new Date()
        },
        update: {
          ownerDiscordId: user.discordId,
          lastUpdated: new Date()
        }
      });
      console.log('Token balance record updated:', tokenResult);
    });

    // Verify that updates were successful
    const updatedNFTs = await prisma.nFT.findMany({
      where: { 
        ownerWallet: address,
        ownerDiscordId: user.discordId
      }
    });
    console.log(`Verified ${updatedNFTs.length} NFTs now have Discord ID`);

    const updatedBalance = await prisma.tokenBalance.findUnique({
      where: { walletAddress: address }
    });
    console.log('Verified token balance:', updatedBalance);

    console.log('=== Wallet Connection Complete, Starting Verification ===');

    // Now verify the holder status with updated data
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);

    console.log('=== Process Complete ===\n');
    return res.status(200).json({ success: true, verification: verificationResult });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 