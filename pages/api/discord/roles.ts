import { NextApiRequest, NextApiResponse } from 'next';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const guild = await rest.get(
      Routes.guild(GUILD_ID!)
    ) as { roles: { id: string, name: string }[] };

    const roleMap = new Map(guild.roles.map(r => [r.id, r.name]));
    
    // Map env role IDs to their Discord names
    const roleMapping = {
      MONEY_MONSTERS: roleMap.get(process.env.MONEY_MONSTERS_ROLE_ID!),
      MONEY_MONSTERS_WHALE: roleMap.get(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!),
      FCKED_CATZ: roleMap.get(process.env.FCKED_CATZ_ROLE_ID!),
      FCKED_CATZ_WHALE: roleMap.get(process.env.FCKED_CATZ_WHALE_ROLE_ID!),
      AI_BITBOTS: roleMap.get(process.env.AI_BITBOTS_ROLE_ID!),
      AI_BITBOTS_WHALE: roleMap.get(process.env.AI_BITBOTS_WHALE_ROLE_ID!),
      MONEY_MONSTERS3D: roleMap.get(process.env.MONEY_MONSTERS3D_ROLE_ID!),
      MONEY_MONSTERS3D_WHALE: roleMap.get(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!),
      CELEBCATZ: roleMap.get(process.env.CELEBCATZ_ROLE_ID!),
      SQUIRRELS: roleMap.get(process.env.SQUIRRELS_ROLE_ID!),
      ENERGY_APES: roleMap.get(process.env.ENERGY_APES_ROLE_ID!),
      RJCTD_BOTS: roleMap.get(process.env.RJCTD_BOTS_ROLE_ID!),
      CANDY_BOTS: roleMap.get(process.env.CANDY_BOTS_ROLE_ID!),
      DOODLE_BOTS: roleMap.get(process.env.DOODLE_BOTS_ROLE_ID!),
      BUXDAO_5: roleMap.get(process.env.BUXDAO_5_ROLE_ID!),
      BUX_BANKER: roleMap.get(process.env.BUX_BANKER_ROLE_ID!),
      BUX_BEGINNER: roleMap.get(process.env.BUX_BEGINNER_ROLE_ID!),
      BUX_SAVER: roleMap.get(process.env.BUX_SAVER_ROLE_ID!),
      BUX_BUILDER: roleMap.get(process.env.BUX_BUILDER_ROLE_ID!)
    };

    // Log the mapping for debugging
    console.log('Role ID to name mapping:', roleMapping);

    return res.status(200).json(roleMapping);
  } catch (error) {
    console.error('Error fetching role names:', error);
    return res.status(500).json({ error: 'Failed to fetch role names' });
  }
} 