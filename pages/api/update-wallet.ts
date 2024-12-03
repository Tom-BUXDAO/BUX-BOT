import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { updateOwnership } from '@/utils/updateOwnership';

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

    // First check if wallet exists
    const existingWallet = await prisma.userWallet.findUnique({
      where: { address }
    });
    console.log('Existing wallet:', existingWallet);

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

      // Now update NFT ownership
      const nftResult = await tx.nFT.updateMany({
        where: {
          ownerWallet: address
        },
        data: {
          ownerDiscordId: session.user.id
        }
      });
      console.log(`Updated ${nftResult.count} NFTs`);

      // Update token balance
      const tokenResult = await tx.tokenBalance.upsert({
        where: { walletAddress: address },
        create: {
          walletAddress: address,
          ownerDiscordId: session.user.id,
          balance: BigInt(0),
          lastUpdated: new Date()
        },
        update: {
          ownerDiscordId: session.user.id,
          lastUpdated: new Date()
        }
      });
      console.log('Token balance record updated:', tokenResult);
    });

    console.log('=== Wallet Connection Process Complete ===\n');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 