import { prisma } from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { updateDiscordRoles } from '../../utils/discordRoles';
import { verifyHolder } from '../../utils/verifyHolder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discordId } = req.body;
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Ensure user exists in Roles table
    const existingRole = await prisma.roles.findUnique({
      where: { discordId }
    });

    if (!existingRole) {
      await prisma.roles.create({
        data: {
          discordId,
          lastUpdated: new Date(),
          buxDao5: false
        }
      });
    }

    // Verify holdings and update roles
    const verificationResult = await verifyHolder(discordId);
    
    // Update roles in database
    await prisma.roles.update({
      where: { discordId },
      data: {
        ...verificationResult,
        lastUpdated: new Date()
      }
    });

    // Update Discord roles
    await updateDiscordRoles(discordId);

    return res.status(200).json({ message: 'Verification completed successfully' });

  } catch (error) {
    console.error('Error in verify-wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 