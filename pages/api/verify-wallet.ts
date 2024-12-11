import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';
import { calculateQualifyingRoles, getCurrentDiscordRoles, calculateRoleUpdates, updateDiscordRoles, getRoleNames, syncUserRoles } from '@/utils/discordRoles';

export const config = {
  maxDuration: 60,
  api: {
    responseLimit: false,
    bodyParser: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Verify the Discord ID is a valid snowflake
    if (!/^\d+$/.test(user.discordId)) {
      return res.status(400).json({ error: 'Invalid Discord ID format' });
    }

    const result = await verifyHolder(address, user.discordId);

    // Sync roles to database
    await syncUserRoles(user.discordId);

    // Convert collections to Record<string, number>
    const nftCounts = Object.entries(result.collections).reduce((acc, [collection, info]) => {
      acc[collection] = info.count;
      return acc;
    }, {} as Record<string, number>);

    // Get current Discord roles
    const currentRoles = await getCurrentDiscordRoles(user.discordId);

    // Calculate qualifying roles with converted collections
    const qualifyingRoles = await calculateQualifyingRoles(
      user.discordId,
      nftCounts,
      result.buxBalance
    );
    console.log('Qualifying roles:', qualifyingRoles);

    // Calculate role changes - await the Promise
    const roleUpdate = await calculateRoleUpdates(currentRoles, qualifyingRoles);
    console.log('Role updates:', roleUpdate);

    // Update Discord roles using Discord ID
    if (roleUpdate.added.length > 0 || roleUpdate.removed.length > 0) {
      console.log('Updating Discord roles...');
      await updateDiscordRoles(user.discordId, roleUpdate);
      console.log('Discord roles updated successfully');
    }

    // Get role names from Discord
    const roleNames = await getRoleNames();
    const assignedRoleNames = qualifyingRoles
      .map(roleId => roleNames.get(roleId) || roleId)
      .filter(Boolean);

    const verification = {
      isHolder: true,
      collections: result.collections,
      buxBalance: result.buxBalance,
      totalNFTs: result.totalNFTs,
      assignedRoles: assignedRoleNames,
      qualifyingBuxRoles: result.qualifyingBuxRoles,
      roleUpdate: roleUpdate
    };

    return res.status(200).json({ success: true, verification });

  } catch (error) {
    console.error('Error in verify-wallet:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
} 