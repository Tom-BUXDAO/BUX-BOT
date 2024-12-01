import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const DISCORD_API = 'https://discord.com/api/v10';
const GUILD_ID = process.env.DISCORD_GUILD_ID;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetch(
      `${DISCORD_API}/guilds/${GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Discord roles');
    }

    const roles = await response.json();
    return res.status(200).json(roles);

  } catch (error) {
    console.error('Error fetching Discord roles:', error);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
} 