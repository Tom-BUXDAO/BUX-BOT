import { prisma } from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { updateDiscordRoles } from '../../utils/discordRoles';
import type { RoleUpdate } from '../../types/discord';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get Discord ID from user record using id or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.id },
          { email: session.user.email! }
        ]
      },
      select: { 
        id: true,
        discordId: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.discordId) {
      return res.status(400).json({ error: 'Discord account not linked' });
    }

    // Calculate role changes
    const roleChanges = await prisma.$queryRaw<RoleUpdate>`
      SELECT * FROM calculate_role_changes(${user.discordId}::text)
    `;

    console.log('Role changes calculated:', {
      userId: user.id,
      discordId: user.discordId,
      changes: roleChanges
    });

    if (roleChanges.added.length > 0 || roleChanges.removed.length > 0) {
      // Apply role changes in Discord
      await updateDiscordRoles(user.discordId, roleChanges);
    }

    return res.status(200).json({ 
      message: 'Verification completed successfully',
      changes: roleChanges
    });

  } catch (error) {
    console.error('Error in verify-wallet:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 