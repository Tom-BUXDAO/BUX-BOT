import { prisma } from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { updateDiscordRoles } from '../../utils/discordRoles';
import { verifyHolder } from '../../utils/verifyHolder';
import type { RoleUpdate, RoleRecord } from '../../types/discord';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Get user info first
    const user = await prisma.user.findUnique({
      where: { discordId },
      select: { discordName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get previous roles
    const previousRoles = await prisma.roles.findUnique({
      where: { discordId }
    });

    // Ensure user exists in Roles table
    if (!previousRoles) {
      await prisma.roles.create({
        data: {
          discordId,
          discordName: user.discordName || '',
          updatedAt: new Date(),
          buxDao5: false
        }
      });
    }

    // Verify holdings and update roles
    const verificationResult = await verifyHolder(discordId);
    
    // Update roles in database
    const updatedRoles = await prisma.roles.update({
      where: { discordId },
      data: {
        ...verificationResult,
        updatedAt: new Date()
      }
    });

    // Calculate role changes
    const roleUpdate: RoleUpdate = {
      added: [],
      removed: [],
      previousRoles: previousRoles as unknown as Record<string, boolean | null>,
      newRoles: updatedRoles as unknown as Record<string, boolean | null>
    };

    // Compare roles and populate added/removed arrays
    Object.keys(updatedRoles).forEach(key => {
      if (key === 'discordId' || key === 'discordName' || key === 'createdAt' || key === 'updatedAt') return;
      
      const prev = (previousRoles as RoleRecord)?.[key] as boolean | null || false;
      const curr = (updatedRoles as RoleRecord)[key] as boolean | null || false;

      if (!prev && curr) roleUpdate.added.push(key);
      if (prev && !curr) roleUpdate.removed.push(key);
    });

    // Update Discord roles with role changes
    await updateDiscordRoles(discordId, roleUpdate);

    return res.status(200).json({ message: 'Verification completed successfully' });

  } catch (error) {
    console.error('Error in verify-wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 