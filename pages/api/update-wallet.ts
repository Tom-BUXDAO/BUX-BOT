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

    console.log('\n=== Starting Wallet Connection ===');
    console.log('Request body:', req.body);
    console.log('User ID:', userId);
    console.log('Wallet Address:', address);

    try {
      // Create new wallet connection
      const wallet = await prisma.userWallet.create({
        data: {
          address,
          userId
        }
      });
      console.log('Created wallet connection:', wallet);
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      return res.status(400).json({ 
        error: 'Failed to create wallet connection',
        details: error.message,
        code: error.code
      });
    }

    // Get user's Discord ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord ID not found' });
    }

    console.log('Discord ID:', user.discordId);

    // Check what exists before updates
    const beforeNFTs = await prisma.nFT.findMany({
      where: { ownerWallet: address }
    });
    console.log(`Found ${beforeNFTs.length} NFTs for wallet`);

    const beforeBalance = await prisma.tokenBalance.findUnique({
      where: { walletAddress: address }
    });
    console.log('Found token balance:', beforeBalance?.balance || 0);

    // Update NFT ownership
    const nftResult = await prisma.nFT.updateMany({
      where: { ownerWallet: address },
      data: { ownerDiscordId: user.discordId }
    });
    console.log(`Updated ${nftResult.count} NFTs with Discord ID`);

    // Update token balance ownership
    const balanceResult = await prisma.tokenBalance.updateMany({
      where: { walletAddress: address },
      data: { ownerDiscordId: user.discordId }
    });
    console.log(`Updated ${balanceResult.count} token balances with Discord ID`);

    // Run verification
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