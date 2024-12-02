import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { verifyHolder } from '@/utils/verifyHolder';
import { updateDiscordRoles } from '@/utils/discordRoles';
import { VerifyResult } from '@/types/verification';
import { prisma } from '@/lib/prisma';

// Define a type for valid role IDs
type RoleId = 
  | '1095363984581984357' | '1093607187454111825' | '1093606579355525252' 
  | '1095034117877399686' | '1095033899492573274' | '1300969268665389157'
  | '1300968964276621313' | '1300968964276621314' | '1300969147441610773'
  | '1093607056696692828' | '1093606438674382858' | '1300968964276621315'
  | '1095033759612547133' | '1300968613179686943' | '1300968964276621316'
  | '1300968964276621317';

const ROLE_ORDER: Record<RoleId, number> = {
  // BUX Token roles
  '1095363984581984357': 1, // BUX BANKER
  '1093607187454111825': 2, // BUX SAVER
  '1093606579355525252': 3, // BUX BUILDER
  '1095034117877399686': 4, // BUX BEGINNER
  '1095033899492573274': 5, // BUXDAO 5
  
  // Main collections
  '1300969268665389157': 10, // MONSTER 3D WHALE
  '1300968964276621313': 11, // BITBOT
  '1300968964276621314': 12, // BITBOT WHALE
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
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const discordId = session.user.id;

    // Get user's wallets first
    const user = await prisma.user.findUnique({
      where: { discordId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      console.error('No wallet address provided');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log(`Verifying wallet ${walletAddress} for user ${session?.user?.name} (${discordId})`);

    // Get user's current roles
    const userRoles = user?.roles || [];
    console.log('Previous roles:', userRoles);

    // First, clear all roles
    await updateDiscordRoles(discordId, []);
    
    // Then verify holdings and get new roles
    const verifyResult = await verifyHolder(walletAddress, discordId);
    
    // Add collection roles and deduplicate
    if (verifyResult.collections) {
      const counts = verifyResult.collections.reduce((acc, col) => {
        acc[col.name] = col.count;
        return acc;
      }, {} as Record<string, number>);

      const rolesToAdd = new Set<string>();

      // BUX Token roles (1-9)
      if (verifyResult.buxBalance >= 100000) {
        rolesToAdd.add('1095363984581984357'); // BUX BANKER
      }
      rolesToAdd.add('1095033899492573274'); // BUXDAO 5

      // Main Collections (10-19)
      // Monster 3D (Gen 2)
      if (counts['money_monsters3d'] > 0) {
        rolesToAdd.add('1300969268665389157'); // MONSTER 3D
      }
      if (counts['money_monsters3d'] >= 25) {
        rolesToAdd.add('1300969268665389159'); // MONSTER 3D WHALE
      }

      // Monster (Gen 1)
      if (counts['money_monsters'] > 0) {
        rolesToAdd.add('1093607056696692828'); // MONSTER
      }
      if (counts['money_monsters'] >= 25) {
        rolesToAdd.add('1300969268665389158'); // MONSTER WHALE
      }

      // Other main collections
      if (counts['fcked_catz'] > 0) {
        rolesToAdd.add('1093606438674382858'); // CAT
      }
      if (counts['ai_bitbots'] >= 10) {
        rolesToAdd.add('1300968964276621314'); // BITBOT WHALE
      }
      if (counts['ai_bitbots'] > 0) {
        rolesToAdd.add('1300968964276621313'); // BITBOT
      }
      if (counts['celebcatz'] > 0) {
        rolesToAdd.add('1300968964276621315'); // CELEB CAT
      }

      // Collab Collections (20-29)
      if (counts['squirrels'] > 0) {
        rolesToAdd.add('1095033759612547133'); // AI SQUIRREL
      }
      if (counts['energy_apes'] > 0) {
        rolesToAdd.add('1300968613179686943'); // AI ENERGY APE
      }
      if (counts['rjctd_bots'] > 0) {
        rolesToAdd.add('1300968964276621316'); // REJECTED BOT
      }
      if (counts['candy_bots'] > 0) {
        rolesToAdd.add('1300969147441610773'); // CANDY BOT
      }
      if (counts['doodle_bot'] > 0) {
        rolesToAdd.add('1300968964276621317'); // DOODLE BOT
      }

      verifyResult.assignedRoles = Array.from(rolesToAdd);
    }

    // Sort roles before assigning
    const sortedRoles = verifyResult.assignedRoles.sort((a, b) => {
      const aOrder = ROLE_ORDER[a as RoleId] || 999;
      const bOrder = ROLE_ORDER[b as RoleId] || 999;
      return aOrder - bOrder;
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
    const removed = userRoles;
    const added = verifyResult.assignedRoles;

    console.log('Role changes:', {
      removed,
      added,
      previousRoles: userRoles,
      newRoles: verifyResult.assignedRoles
    });

    // Update all related tables with Discord ID
    await prisma.$transaction(async (tx) => {
      // Update TokenBalance table
      await tx.tokenBalance.updateMany({
        where: {
          walletAddress: {
            in: user.wallets.map(w => w.address)
          }
        },
        data: {
          ownerDiscordId: discordId
        }
      });

      // Update NFT table
      await tx.nFT.updateMany({
        where: {
          ownerAddress: {
            in: user.wallets.map(w => w.address)
          }
        },
        data: {
          ownerDiscordId: discordId
        }
      });

      // Existing role updates...
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