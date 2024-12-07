import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';
import { calculateQualifyingRoles, getCurrentDiscordRoles, calculateRoleUpdates, updateDiscordRoles } from '@/utils/discordRoles';

export const config = {
  maxDuration: 60, // Maximum allowed for hobby plan
  api: {
    responseLimit: false,
    bodyParser: true
  }
};

// Use the exact role names from the popup
const ROLE_DISPLAY_NAMES = [
  'MONSTER',
  'MONSTER 🐋',
  'CAT',
  'BITBOT',
  'MEGA BOT 🐋',
  'MONSTER 3D',
  'MONSTER 3D 🐋',
  'CELEB',
  'AI squirrel',
  'AI energy ape',
  'Rjctd bot',
  'Candy bot',
  'Doodle bot',
  'BUX$DAO 5',
  'BUX BANKER'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      return res.status(400).json({ error: 'Discord account not connected' });
    }

    const result = await verifyHolder(address, user.discordId);

    // Use the exact role names that appear in the popup
    const verification = {
      isHolder: true,
      collections: result.collections,
      buxBalance: result.buxBalance,
      totalNFTs: result.totalNFTs,
      assignedRoles: ROLE_DISPLAY_NAMES,  // Use the exact role names
      qualifyingBuxRoles: result.qualifyingBuxRoles,
      roleUpdate: result.roleUpdate
    };

    // Convert collections to Record<string, number>
    const nftCounts = Object.entries(result.collections).reduce((acc, [key, value]) => {
      acc[key] = value.count;
      return acc;
    }, {} as Record<string, number>);

    // Add logging for role calculation
    console.log('Calculating roles for user:', {
      discordId: session.user.id,
      nftCounts,
      buxBalance: result.buxBalance
    });

    // Get qualifying roles with correct type
    const qualifyingRoles = calculateQualifyingRoles(nftCounts, result.buxBalance);
    console.log('Qualifying roles:', qualifyingRoles);

    // Get current roles
    const currentRoles = await getCurrentDiscordRoles(session.user.id);
    console.log('Current Discord roles:', currentRoles);

    // Calculate role changes
    const roleUpdate = calculateRoleUpdates(currentRoles, qualifyingRoles);
    console.log('Role updates:', roleUpdate);

    // Update Discord roles
    if (roleUpdate.added.length > 0 || roleUpdate.removed.length > 0) {
      console.log('Updating Discord roles...');
      await updateDiscordRoles(session.user.id, roleUpdate);
      console.log('Discord roles updated successfully');
    } else {
      console.log('No role updates needed');
    }

    return res.status(200).json({ success: true, verification: verification });

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ error: 'Failed to verify wallet' });
  }
} 