import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';

export const config = {
  maxDuration: 60, // Maximum allowed for hobby plan
  api: {
    responseLimit: false,
    bodyParser: true
  }
};

// Map role IDs to display names
const ROLE_NAMES = {
  '1095034117877399686': 'MONSTER',
  '1095034117877399687': 'MONSTER 🐋',
  '1093606438674382858': 'CAT',
  '1095033566070583457': 'BITBOT',
  '1095033566070583458': 'MEGA BOT 🐋',
  '1300968964276621313': 'MONSTER 3D',
  '1300968964276621314': 'MONSTER 3D 🐋',
  '1093606438674382859': 'CELEB',
  '1093607056696692828': 'AI squirrel',
  '1095033759612547133': 'AI energy ape',
  '1300969268665389157': 'Rjctd bot',
  '1095033899492573274': 'Candy bot',
  '1300969353952362557': 'Doodle bot',
  '1248428373487784006': 'BUX$DAO 5',
  '1095363984581984357': 'BUX BANKER'
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

    // Map role IDs to display names before sending response
    const mappedRoles = result.assignedRoles.map(roleId => ROLE_NAMES[roleId] || roleId);

    const verification = {
      isHolder: true,
      collections: result.collections,
      buxBalance: result.buxBalance,
      totalNFTs: result.totalNFTs,
      assignedRoles: mappedRoles,  // Send display names instead of IDs
      qualifyingBuxRoles: result.qualifyingBuxRoles,
      roleUpdate: result.roleUpdate
    };

    return res.status(200).json({ success: true, verification: verification });

  } catch (error) {
    console.error('Error verifying wallet:', error);
    return res.status(500).json({ error: 'Failed to verify wallet' });
  }
} 