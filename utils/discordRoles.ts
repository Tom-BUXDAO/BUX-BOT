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

export async function updateDiscordRoles(discordId: string, newRoles: string[]): Promise<RoleUpdate> {
  try {
    // Get current member data and role info
    const [member, guild] = await Promise.all([
      rest.get(Routes.guildMember(GUILD_ID!, discordId)) as Promise<{ roles: string[] }>,
      rest.get(Routes.guild(GUILD_ID!)) as Promise<{ roles: { id: string, name: string }[] }>
    ]);

    const currentRoles = member.roles;
    const managedRoleIds = getManagedRoleIds();
    const roleNameMap = new Map(guild.roles.map(r => [r.id, r.name]));

    console.log('Current roles:', currentRoles);
    console.log('New roles to assign:', newRoles);
    console.log('Managed role IDs:', managedRoleIds);

    // Only remove roles we manage
    const rolesToRemove = currentRoles.filter(role => 
      managedRoleIds.has(role) && !newRoles.includes(role)
    );

    // Add new roles
    for (const role of newRoles) {
      if (!currentRoles.includes(role)) {
        try {
          await rest.put(Routes.guildMemberRole(GUILD_ID!, discordId, role));
          console.log(`Successfully added role ${roleNameMap.get(role)} (${role}) to ${discordId}`);
        } catch (error) {
          console.error(`Failed to add role ${roleNameMap.get(role)} (${role}):`, error);
        }
      }
    }

    // Remove old roles
    for (const role of rolesToRemove) {
      try {
        await rest.delete(Routes.guildMemberRole(GUILD_ID!, discordId, role));
        console.log(`Successfully removed role ${roleNameMap.get(role)} (${role}) from ${discordId}`);
      } catch (error) {
        console.error(`Failed to remove role ${roleNameMap.get(role)} (${role}):`, error);
      }
    }

    // Get final roles after changes
    const updatedMember = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { roles: string[] };

    const added = newRoles.filter(role => !currentRoles.includes(role));
    const removed = rolesToRemove;

    // Return role names instead of IDs
    return {
      added: added.map(id => roleNameMap.get(id) || id),
      removed: removed.map(id => roleNameMap.get(id) || id),
      previousRoles: currentRoles.map(id => roleNameMap.get(id) || id),
      newRoles: updatedMember.roles.map(id => roleNameMap.get(id) || id)
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
}

// Add this function to help us map role IDs to names
async function logRoleNames() {
  try {
    const guild = await rest.get(
      Routes.guild(GUILD_ID!)
    ) as { roles: { id: string, name: string }[] };

    const roleMap = new Map(guild.roles.map(r => [r.id, r.name]));
    
    // Log all role mappings from .env.local
    console.log('Role ID to Name mappings:');
    console.log('AI_BITBOTS_ROLE_ID:', roleMap.get(process.env.AI_BITBOTS_ROLE_ID!));
    console.log('FCKED_CATZ_ROLE_ID:', roleMap.get(process.env.FCKED_CATZ_ROLE_ID!));
    console.log('MONEY_MONSTERS_ROLE_ID:', roleMap.get(process.env.MONEY_MONSTERS_ROLE_ID!));
    console.log('MONEY_MONSTERS3D_ROLE_ID:', roleMap.get(process.env.MONEY_MONSTERS3D_ROLE_ID!));
    console.log('CELEBCATZ_ROLE_ID:', roleMap.get(process.env.CELEBCATZ_ROLE_ID!));
    console.log('AI_BITBOTS_WHALE_ROLE_ID:', roleMap.get(process.env.AI_BITBOTS_WHALE_ROLE_ID!));
    console.log('FCKED_CATZ_WHALE_ROLE_ID:', roleMap.get(process.env.FCKED_CATZ_WHALE_ROLE_ID!));
    console.log('MONEY_MONSTERS_WHALE_ROLE_ID:', roleMap.get(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!));
    console.log('MONEY_MONSTERS3D_WHALE_ROLE_ID:', roleMap.get(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!));
    console.log('BUX_BANKER_ROLE_ID:', roleMap.get(process.env.BUX_BANKER_ROLE_ID!));
    console.log('CANDY_BOTS_ROLE_ID:', roleMap.get(process.env.CANDY_BOTS_ROLE_ID!));
    console.log('DOODLE_BOTS_ROLE_ID:', roleMap.get(process.env.DOODLE_BOTS_ROLE_ID!));
    console.log('ENERGY_APES_ROLE_ID:', roleMap.get(process.env.ENERGY_APES_ROLE_ID!));
    console.log('RJCTD_BOTS_ROLE_ID:', roleMap.get(process.env.RJCTD_BOTS_ROLE_ID!));
    console.log('SQUIRRELS_ROLE_ID:', roleMap.get(process.env.SQUIRRELS_ROLE_ID!));
    console.log('WARRIORS_ROLE_ID:', roleMap.get(process.env.WARRIORS_ROLE_ID!));
    console.log('BUX_BEGINNER_ROLE_ID:', roleMap.get(process.env.BUX_BEGINNER_ROLE_ID!));
    console.log('BUX_SAVER_ROLE_ID:', roleMap.get(process.env.BUX_SAVER_ROLE_ID!));
    console.log('BUX_BUILDER_ROLE_ID:', roleMap.get(process.env.BUX_BUILDER_ROLE_ID!));
    console.log('BUXDAO_5_ROLE_ID:', roleMap.get(process.env.BUXDAO_5_ROLE_ID!));

    return roleMap;
  } catch (error) {
    console.error('Error fetching role names:', error);
    return new Map();
  }
}

// Call this when the server starts
logRoleNames().then(() => console.log('Role names logged'));
 