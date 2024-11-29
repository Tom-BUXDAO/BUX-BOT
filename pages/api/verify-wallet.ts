import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { verifyHolder } from '@/utils/verifyHolder';
import { updateDiscordRoles } from '@/utils/discordRoles';
import { VerifyResult, RoleUpdate } from '@/types/verification';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResult | { error: string; details?: string }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Add wallet to user's wallets if not exists
    await prisma.userWallet.upsert({
      where: {
        address: walletAddress,
      },
      update: {
        userId: session.user.id,
      },
      create: {
        address: walletAddress,
        userId: session.user.id,
      },
    });

    // Pass Discord ID to verifyHolder to check all wallets
    const result = await verifyHolder(walletAddress, session.user.id);
    
    // Update Discord roles and get role changes
    const roleUpdate = await updateDiscordRoles(
      session.user.id,
      result.assignedRoles
    );

    console.log('Role update result:', {
      userId: session.user.id,
      assignedRoles: result.assignedRoles,
      roleUpdate
    });

    const response: VerifyResult = {
      ...result,
      roleUpdate: {
        added: roleUpdate.added,
        removed: roleUpdate.removed
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ 
      error: 'Failed to verify wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 