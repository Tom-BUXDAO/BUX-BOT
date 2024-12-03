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

    // Check NFTs before update
    const nftsBefore = await prisma.nFT.findMany({
      where: { ownerWallet: address }
    });
    console.log(`NFTs before update: ${nftsBefore.length}`);

    // Check token balance before update
    const balanceBefore = await prisma.tokenBalance.findUnique({
      where: { walletAddress: address }
    });
    console.log('Token balance before:', balanceBefore);

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Add wallet to user with proper typing
      const wallet = await tx.userWallet.upsert({
        where: {
          address: address
        },
        update: {
          userId: userId
        },
        create: {
          address: address as string,
          userId: userId as string
        }
      });
      console.log('Wallet connection updated:', wallet);

      // Update ownership records with guaranteed non-null userId
      await updateOwnership(address, userId);

      // Check NFTs after update
      const nftsAfter = await tx.nFT.findMany({
        where: { ownerWallet: address }
      });
      console.log(`NFTs after update: ${nftsAfter.length}`);

      // Check token balance after update
      const balanceAfter = await tx.tokenBalance.findUnique({
        where: { walletAddress: address }
      });
      console.log('Token balance after:', balanceAfter);
    });

    console.log('=== Wallet Connection Process Complete ===\n');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 