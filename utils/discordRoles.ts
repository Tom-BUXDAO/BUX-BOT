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
    if (!guildId) {
      throw new Error('Missing Discord guild ID');
    }

    console.log('Role changes to apply:', roleUpdate);

    // Add roles
    for (const roleId of roleUpdate.added) {
      console.log(`Adding role ${roleId} to user ${userId}`);
      await rest.put(
        Routes.guildMemberRole(guildId, userId, roleId)
      );
    }

    // Remove roles
    for (const roleId of roleUpdate.removed) {
      console.log(`Removing role ${roleId} from user ${userId}`);
      await rest.delete(
        Routes.guildMemberRole(guildId, userId, roleId)
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

export function calculateQualifyingRoles(nftCounts: Record<string, number>, buxBalance: number) {
  const qualifyingRoles = new Set<string>();

  // Check NFT collection thresholds
  Object.entries(nftCounts).forEach(([collection, count]) => {
    const config = NFT_THRESHOLDS[collection as CollectionName];
    if (!config) return;

    // Add holder role if threshold met
    if (config.holder && count >= 1) {
      qualifyingRoles.add(config.holder);
    }

    // Add whale role if threshold met
    if (hasWhaleConfig(config) && count >= config.whale.threshold) {
      qualifyingRoles.add(config.whale.roleId!);
    }
  });

  // Check BUX balance thresholds
  BUX_THRESHOLDS.forEach(tier => {
    if (tier.roleId && buxBalance >= tier.threshold) {
      qualifyingRoles.add(tier.roleId);
    }
  });

  // Add BUXDAO 5 role if any NFTs held
  if (BUXDAO_5_ROLE_ID && Object.values(nftCounts).some(count => count > 0)) {
    qualifyingRoles.add(BUXDAO_5_ROLE_ID);
  }

  return Array.from(qualifyingRoles);
}

export async function getCurrentDiscordRoles(userId: string): Promise<string[]> {
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !token) {
      console.error('Missing Discord configuration');
      throw new Error('Missing Discord configuration');
    }

    // Use the REST instance we already have configured
    const member = await rest.get(
      Routes.guildMember(guildId, userId)
    ) as { roles: string[] };

    console.log('Fetched member roles:', member.roles);
    return member.roles;
  } catch (error) {
    console.error('Error getting current Discord roles:', error);
    // Return empty array instead of throwing to handle gracefully
    return [];
  }
}

export function calculateRoleUpdates(currentRoles: string[], qualifyingRoles: string[]): RoleUpdate {
  const managedRoles = getManagedRoleIds();
  const currentManagedRoles = currentRoles.filter(id => managedRoles.has(id));
  
  return {
    added: qualifyingRoles.filter(id => !currentManagedRoles.includes(id)),
    removed: currentManagedRoles.filter(id => !qualifyingRoles.includes(id)),
    previousRoles: currentManagedRoles,
    newRoles: qualifyingRoles
  };
}
 