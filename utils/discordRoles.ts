import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { RoleUpdate } from '@/types/verification';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

let cachedRoleNames: Map<string, string> | null = null;

async function getRoleNames(): Promise<Map<string, string>> {
  if (cachedRoleNames) return cachedRoleNames;

  try {
    const guild = await rest.get(
      Routes.guild(GUILD_ID!)
    ) as { roles: { id: string, name: string }[] };

    cachedRoleNames = new Map(guild.roles.map(r => [r.id, r.name]));
    console.log('Cached role names:', Object.fromEntries(cachedRoleNames));
    return cachedRoleNames;
  } catch (error) {
    console.error('Error fetching role names:', error);
    return new Map();
  }
}

export { getRoleNames };

interface WhaleConfig {
  holder: string | undefined;
  whale: {
    roleId: string | undefined;
    threshold: number;
  };
}

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is WhaleConfig {
  return config !== undefined && 'whale' in config;
}

// Get all role IDs we manage
const getManagedRoleIds = () => {
  const roleIds = new Set<string>();
  
  // Add NFT roles
  Object.values(NFT_THRESHOLDS).forEach(config => {
    if (config.holder) roleIds.add(config.holder);
    if (hasWhaleConfig(config) && config.whale.roleId) {
      roleIds.add(config.whale.roleId);
    }
  });

  // Add BUX roles
  BUX_THRESHOLDS.forEach(tier => {
    if (tier.roleId) roleIds.add(tier.roleId);
  });

  // Add BUXDAO 5 role
  if (BUXDAO_5_ROLE_ID) roleIds.add(BUXDAO_5_ROLE_ID);

  return roleIds;
};

export async function updateDiscordRoles(userId: string, roleUpdate: RoleUpdate) {
  console.log('Starting Discord role update for user:', userId);
  
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !token) {
      console.error('Missing Discord configuration');
      throw new Error('Missing Discord configuration');
    }

    console.log('Role changes to apply:', roleUpdate);

    // Add roles
    for (const roleId of roleUpdate.added) {
      console.log(`Adding role ${roleId} to user ${userId}`);
      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Remove roles
    for (const roleId of roleUpdate.removed) {
      console.log(`Removing role ${roleId} from user ${userId}`);
      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Role update completed successfully');
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
}

// Add this function to map role IDs to names
async function logEnvRoleNames() {
  try {
    const guild = await rest.get(
      Routes.guild(GUILD_ID!)
    ) as { roles: { id: string, name: string }[] };

    const roleMap = new Map(guild.roles.map(r => [r.id, r.name]));
    
    // Create a mapping object for easy reference
    const roleMapping = {
      'MONSTER': roleMap.get(process.env.MONEY_MONSTERS_ROLE_ID!),
      'MONSTER 🐋': roleMap.get(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!),
      'FCKED CATZ': roleMap.get(process.env.FCKED_CATZ_ROLE_ID!),
      'FCKED CATZ 🐋': roleMap.get(process.env.FCKED_CATZ_WHALE_ROLE_ID!),
      'BITBOT': roleMap.get(process.env.AI_BITBOTS_ROLE_ID!),
      'MEGA BOT 🐋': roleMap.get(process.env.AI_BITBOTS_WHALE_ROLE_ID!),
      'MONSTER 3D': roleMap.get(process.env.MONEY_MONSTERS3D_ROLE_ID!),
      'MONSTER 3D 🐋': roleMap.get(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!),
      'CELEB': roleMap.get(process.env.CELEBCATZ_ROLE_ID!),
      'AI squirrel': roleMap.get(process.env.SQUIRRELS_ROLE_ID!),
      'AI energy ape': roleMap.get(process.env.ENERGY_APES_ROLE_ID!),
      'Rjctd bot': roleMap.get(process.env.RJCTD_BOTS_ROLE_ID!),
      'Candy bot': roleMap.get(process.env.CANDY_BOTS_ROLE_ID!),
      'Doodle bot': roleMap.get(process.env.DOODLE_BOTS_ROLE_ID!),
      'BUX$DAO 5': roleMap.get(process.env.BUXDAO_5_ROLE_ID!),
      'BUX BANKER': roleMap.get(process.env.BUX_BANKER_ROLE_ID!)
    };

    console.log('Role name mapping:', roleMapping);
    return roleMapping;
  } catch (error) {
    console.error('Error fetching role names:', error);
    return null;
  }
}

// Call this when server starts
logEnvRoleNames().then(mapping => {
  if (mapping) {
    console.log('Role mapping completed successfully');
  }
});
 