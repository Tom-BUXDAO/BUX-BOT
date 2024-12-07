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

// Map role IDs to display names
const ROLE_ID_TO_NAME: Record<string, string> = {
  '1248416679504117861': 'MONSTER',
  '1248417674476916809': 'MONSTER 🐋',
  '1248417591215784019': 'CAT',
  '1095363984581984357': 'BITBOT',
  '1248428373487784006': 'MEGA BOT 🐋',
  // Add other role mappings here
};

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

    // Convert collections to Record<string, number> before role calculation
    const nftCounts = Object.entries(result.collections).reduce((acc, [collection, info]) => {
      acc[collection] = info.count;
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

    // Convert role IDs to display names
    const assignedRoleNames = qualifyingRoles
      .map(roleId => ROLE_ID_TO_NAME[roleId] || roleId)
      .filter(name => name); // Remove any undefined values

    const verification = {
      isHolder: true,
      collections: result.collections,
      buxBalance: result.buxBalance,
      totalNFTs: result.totalNFTs,
      assignedRoles: assignedRoleNames, // Use the mapped role names
      qualifyingBuxRoles: result.qualifyingBuxRoles,
      roleUpdate: roleUpdate
    };

    return res.status(200).json({ success: true, verification });

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ error: 'Failed to verify wallet' });
  }
} 