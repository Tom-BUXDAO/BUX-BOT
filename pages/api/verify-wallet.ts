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

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First ensure user exists and get their database ID
      const user = await tx.user.upsert({
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
        }
      });

      // Add wallet to user's wallets
      await tx.userWallet.upsert({
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

      // Update NFTs ownership
      await tx.nFT.updateMany({
        where: {
          ownerWallet: walletAddress,
          ownerDiscordId: null,
        },
        data: {
          ownerDiscordId: user.discordId,
        },
      });

      // Update token balances
      await tx.tokenBalance.update({
        where: {
          walletAddress: walletAddress,
        },
        data: {
          ownerDiscordId: user.discordId,
        },
      });

      // Verify holder status
      const verifyResult = await verifyHolder(walletAddress, discordId);
      
      // Update Discord roles
      const roleUpdate = await updateDiscordRoles(
        discordId,
        verifyResult.assignedRoles
      );

      console.log('Role update result:', {
        userId: discordId,
        dbUserId: user.id,
        assignedRoles: verifyResult.assignedRoles,
        roleUpdate
      });

      return {
        ...verifyResult,
        roleUpdate: {
          added: roleUpdate.added,
          removed: roleUpdate.removed
        }
      };
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 