import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { verifyHolder } from '@/utils/verifyHolder';
import { updateDiscordRoles } from '@/utils/discordRoles';
import { VerifyResult } from '@/types/verification';
import { prisma } from '@/lib/prisma';

const ROLE_ORDER = {
  // BUX Token roles
  '1095363984581984357': 1, // BUX BANKER
  '1093607187454111825': 2, // BUX SAVER
  '1093606579355525252': 3, // BUX BUILDER
  '1095034117877399686': 4, // BUX BEGINNER
  '1095033899492573274': 5, // BUXDAO 5
  
  // Main collections
  '1300969268665389157': 10, // MONSTER 3D WHALE (25+ MM3D)
  '1300968964276621313': 11, // BITBOT
  '1300968964276621314': 12, // BITBOT WHALE (10+ Bitbots)
  '1300969147441610773': 13, // CANDY BOT
  '1093607056696692828': 14, // MONSTER
  '1093606438674382858': 15, // CAT
  '1300968964276621315': 16, // CELEB CAT
  
  // Collab collections
  '1095033759612547133': 20, // AI SQUIRREL
  '1300968613179686943': 21, // AI ENERGY APE
  '1300968964276621316': 22, // REJECTED BOT
  '1300968964276621317': 23  // DOODLE BOT
};

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

    // Get user's current roles
    const user = await prisma.user.findUnique({
      where: { discordId },
      select: { id: true, roles: true }
    });

    const previousRoles = user?.roles || [];
    console.log('Previous roles:', previousRoles);

    // First, clear all roles
    await updateDiscordRoles(discordId, []);
    
    // Then verify holdings and get new roles
    const verifyResult = await verifyHolder(walletAddress, discordId);
    
    // Add whale roles based on collection counts
    if (verifyResult.collections) {
      const counts = verifyResult.collections.reduce((acc, col) => {
        acc[col.name] = col.count;
        return acc;
      }, {} as Record<string, number>);

      // Add BitBot Whale role if they have 10+ BitBots
      if (counts['ai_bitbots'] >= 10) {
        verifyResult.assignedRoles.push('1300968964276621314');
      }

      // Add Monster 3D Whale role if they have 25+ MM3D
      if (counts['money_monsters3d'] >= 25) {
        verifyResult.assignedRoles.push('1300969268665389157');
      }

      // Add Celeb Cat role if they have any celebcatz
      if (counts['celebcatz'] > 0) {
        verifyResult.assignedRoles.push('1300968964276621315');
      }

      // Add Rejected Bot role if they have any rjctd_bots
      if (counts['rjctd_bots'] > 0) {
        verifyResult.assignedRoles.push('1300968964276621316');
      }

      // Add Doodle Bot role if they have any doodle_bot
      if (counts['doodle_bot'] > 0) {
        verifyResult.assignedRoles.push('1300968964276621317');
      }
    }

    // Sort roles before assigning
    const sortedRoles = verifyResult.assignedRoles.sort((a, b) => {
      return (ROLE_ORDER[a] || 999) - (ROLE_ORDER[b] || 999);
    });

    verifyResult.assignedRoles = sortedRoles;

    // Update Discord with new roles
    await updateDiscordRoles(discordId, verifyResult.assignedRoles);

    // Update user roles in database
    await prisma.user.update({
      where: { discordId },
      data: { roles: verifyResult.assignedRoles }
    });

    // All previous roles were removed, and new ones were added
    const removed = previousRoles;
    const added = verifyResult.assignedRoles;

    console.log('Role changes:', {
      removed,
      added,
      previousRoles,
      newRoles: verifyResult.assignedRoles
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