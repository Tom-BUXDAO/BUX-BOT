import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { verifyHolder } from '@/utils/verifyHolder';
import { updateDiscordRoles } from '@/utils/discordRoles';
import { VerifyResult } from '@/types/verification';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResult | { error: string; details?: string }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const discordId = session?.user?.id;
    const discordName = session?.user?.name;

    if (!discordId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // First ensure user exists and get their database ID
    const user = await prisma.user.upsert({
      where: {
        discordId,
      },
      update: {
        discordName: discordName || 'Unknown',
      },
      create: {
        discordId,
        discordName: discordName || 'Unknown',
      },
      select: {
        id: true,
        discordId: true,
        roles: true,
      }
    });

    // Store current roles for comparison
    const previousRoles = user.roles || [];

    // Reset user roles in database
    await prisma.user.update({
      where: { id: user.id },
      data: { roles: [] }
    });

    // Add wallet to user's wallets
    await prisma.userWallet.upsert({
      where: {
        address: walletAddress,
      },
      update: {
        userId: user.id,
      },
      create: {
        address: walletAddress,
        userId: user.id,
      },
    });

    // Update NFTs ownership in batches
    await prisma.nFT.updateMany({
      where: {
        ownerWallet: walletAddress,
        ownerDiscordId: null,
      },
      data: {
        ownerDiscordId: user.discordId,
      },
    });

    try {
      // Update token balances - this might not exist yet
      await prisma.tokenBalance.update({
        where: {
          walletAddress: walletAddress,
        },
        data: {
          ownerDiscordId: user.discordId,
        },
      });
    } catch (error) {
      console.log('Token balance not found for wallet, skipping update');
    }

    // Verify holder status with longer timeout
    const verifyResult = await verifyHolder(walletAddress, discordId);
    
    // Update Discord roles - all current roles will be treated as new
    const roleUpdate = await updateDiscordRoles(
      discordId,
      verifyResult.assignedRoles
    );

    console.log('Role update result:', {
      userId: discordId,
      dbUserId: user.id,
      previousRoles,
      newRoles: verifyResult.assignedRoles,
      roleUpdate: {
        added: verifyResult.assignedRoles,
        removed: previousRoles.filter(role => !verifyResult.assignedRoles.includes(role))
      }
    });

    return res.status(200).json({
      ...verifyResult,
      roleUpdate: {
        added: verifyResult.assignedRoles,
        removed: previousRoles.filter(role => !verifyResult.assignedRoles.includes(role))
      }
    });

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true,
  },
  maxDuration: 60 // Set to maximum allowed for hobby plan (60 seconds)
}; 