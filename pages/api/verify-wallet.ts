import { prisma } from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { updateDiscordRoles } from '../../utils/discordRoles';
import type { RoleUpdate } from '../../types/discord';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Call database function to calculate role updates
    const roleChanges = await prisma.$queryRaw<RoleUpdate>`
      SELECT * FROM calculate_role_changes(${discordId}::text)
    `;

    if (roleChanges.added.length > 0 || roleChanges.removed.length > 0) {
      // Apply role changes in Discord
      await updateDiscordRoles(discordId, roleChanges);
    }

    return res.status(200).json({ 
      message: 'Verification completed successfully',
      changes: roleChanges
    });

  } catch (error) {
    console.error('Error in verify-wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 