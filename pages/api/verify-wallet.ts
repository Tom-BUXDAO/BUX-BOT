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
    console.log('Starting wallet verification...');
    const session = await getServerSession(req, res, authOptions);
    const discordId = session?.user?.id;
    const discordName = session?.user?.name;

    if (!discordId) {
      console.error('No Discord ID found in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      console.error('No wallet address provided');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log(`Verifying wallet ${walletAddress} for user ${discordName} (${discordId})`);

    // Get user's current roles first
    const user = await prisma.user.findUnique({
      where: { discordId },
      select: { id: true, roles: true }
    });

    const previousRoles = user?.roles || [];
    console.log('Previous roles:', previousRoles);

    // Verify holder status
    console.log('Calling verifyHolder...');
    const verifyResult = await verifyHolder(walletAddress, discordId);
    console.log('VerifyHolder result:', verifyResult);
    
    // Update Discord roles
    console.log('Updating Discord roles...');
    await updateDiscordRoles(discordId, verifyResult.assignedRoles);

    // Update user roles in database
    await prisma.user.update({
      where: { discordId },
      data: { roles: verifyResult.assignedRoles }
    });

    // Calculate added and removed roles
    const added = verifyResult.assignedRoles.filter(role => !previousRoles.includes(role));
    const removed = previousRoles.filter(role => !verifyResult.assignedRoles.includes(role));

    console.log('Role changes:', {
      added,
      removed,
      previousRoles,
      newRoles: verifyResult.assignedRoles,
      collections: verifyResult.collections,
      buxBalance: verifyResult.buxBalance
    });

    return res.status(200).json({
      ...verifyResult,
      roleUpdate: { added, removed }
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
  maxDuration: 60
}; 