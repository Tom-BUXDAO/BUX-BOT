import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { RoleUpdate } from '@/types/verification';
import type { RoleConfig } from '@/types/roles';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { NFT_THRESHOLDS, BUX_THRESHOLDS } from '@/utils/roleConfig';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

export async function updateDiscordRoles(
  userId: string,
  roleUpdate: RoleUpdate
): Promise<void> {
  try {
    // Get all valid role IDs from our database
    const validRoleIds = await prisma.roleConfig.findMany({
      select: { roleId: true }
    });
    const validRoleSet = new Set(validRoleIds.map(r => r.roleId));

    // Filter role updates to only include roles we manage
    const filteredUpdate = {
      added: roleUpdate.added.filter(id => validRoleSet.has(id)),
      removed: roleUpdate.removed.filter(id => validRoleSet.has(id))
    };

    // Get the guild member
    const member = await rest.get(
      Routes.guildMember(GUILD_ID!, userId)
    ) as { roles: string[] };

    // Filter out roles we don't have permission for
    const safeToRemove = filteredUpdate.removed.filter(roleId => {
      // Skip the problematic role
      if (roleId === '949022529551495248') {
        console.log('Skipping removal of protected role:', roleId);
        return false;
      }
      return true;
    });

    // Remove roles we can modify
    for (const roleId of safeToRemove) {
      try {
        await rest.delete(
          Routes.guildMemberRole(GUILD_ID!, userId, roleId)
        );
      } catch (error: any) {
        if (error.code === 50013) {
          console.warn(`No permission to remove role ${roleId}`);
          continue;
        }
        throw error;
      }
    }

    // Add new roles
    for (const roleId of filteredUpdate.added) {
      try {
        await rest.put(
          Routes.guildMemberRole(GUILD_ID!, userId, roleId)
        );
      } catch (error: any) {
        if (error.code === 50013) {
          console.warn(`No permission to add role ${roleId}`);
          continue;
        }
        throw error;
      }
    }

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    // Don't throw - we want verification to succeed even if role updates fail
  }
}

export async function getQualifyingRoles(discordId: string): Promise<string[]> {
  // Get user's role status from database
  const roles = await prisma.roles.findUnique({
    where: { discordId }
  });

  if (!roles) return [];

  // Get role configurations
  const roleConfigs = await prisma.roleConfig.findMany();
  
  // Map role flags to role IDs
  return roleConfigs
    .filter(config => {
      const roleName = config.roleName;
      
      // Map database flags to role names with null checks
      const flagMap: Record<string, boolean> = {
        // NFT Holder roles
        'ai_bitbots_holder': roles.aiBitbotsHolder ?? false,
        'fcked_catz_holder': roles.fckedCatzHolder ?? false,
        'money_monsters_holder': roles.moneyMonstersHolder ?? false,
        'money_monsters3d_holder': roles.moneyMonsters3dHolder ?? false,
        'celebcatz_holder': roles.celebCatzHolder ?? false,
        'candy_bots_holder': roles.candyBotsHolder ?? false,
        'doodle_bot_holder': roles.doodleBotsHolder ?? false,
        'energy_apes_holder': roles.energyApesHolder ?? false,
        'rjctd_bots_holder': roles.rjctdBotsHolder ?? false,
        'squirrels_holder': roles.squirrelsHolder ?? false,
        'warriors_holder': roles.warriorsHolder ?? false,

        // Whale roles
        'ai_bitbots_whale': roles.aiBitbotsWhale ?? false,
        'fcked_catz_whale': roles.fckedCatzWhale ?? false,
        'money_monsters_whale': roles.moneyMonstersWhale ?? false,
        'money_monsters3d_whale': roles.moneyMonsters3dWhale ?? false,

        // BUX roles
        'bux_banker': roles.buxBanker ?? false,
        'bux_saver': roles.buxSaver ?? false,
        'bux_builder': roles.buxBuilder ?? false,
        'bux_beginner': roles.buxBeginner ?? false,

        // Special roles
        'bux_dao_5': roles.buxDao5 ?? false,
        'mm_top_10': roles.mmTop10 ?? false,
        'mm3d_top_10': roles.mm3dTop10 ?? false
      };

      return flagMap[roleName] === true;
    })
    .map(config => config.roleId);
}

export async function getCurrentRoles(discordId: string): Promise<string[]> {
  try {
    const member = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { roles: string[] };
    
    return member.roles;
  } catch (error) {
    console.error('Error fetching member roles:', error);
    return [];
  }
}

export async function calculateQualifyingRoles(
  discordId: string,
  nftCounts?: Record<string, number>,
  buxBalance?: number
): Promise<string[]> {
  // Get user's role status from database
  const userRoles = await prisma.roles.findUnique({
    where: { discordId }
  });

  if (!userRoles) return [];

  // Get role configurations
  const roleConfigs = await prisma.roleConfig.findMany();
  
  // Map role flags to role IDs
  const qualifyingRoles = roleConfigs
    .filter(config => {
      // Convert roleName to database column name
      const dbColumn = config.roleName
        .split('_')
        .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
        .replace('holder', 'Holder')
        .replace('whale', 'Whale')
        .replace('celebcatz', 'celebCatz')
        .replace('doodle_bot', 'doodleBots');
      
      // Check if the role flag is true
      const hasRole = userRoles[dbColumn as keyof typeof userRoles];
      console.log(`Checking role ${config.roleName} (${dbColumn}): ${hasRole}`);
      return hasRole === true;
    })
    .map(config => config.roleId);

  console.log('Qualifying roles:', qualifyingRoles);
  return qualifyingRoles;
}

export async function getCurrentDiscordRoles(discordId: string): Promise<string[]> {
  return getCurrentRoles(discordId);
}

export async function calculateRoleUpdates(
  currentRoles: string[],
  qualifyingRoles: string[]
): Promise<RoleUpdate> {
  // Get all valid role IDs from our database
  const validRoleIds = await prisma.roleConfig.findMany({
    select: { roleId: true }
  });
  const validRoleSet = new Set(validRoleIds.map(r => r.roleId));

  // Only consider roles that exist in our RoleConfig table
  const validCurrentRoles = currentRoles.filter(role => validRoleSet.has(role));
  
  const added = qualifyingRoles.filter(role => !validCurrentRoles.includes(role));
  const removed = validCurrentRoles.filter(role => !qualifyingRoles.includes(role));

  return {
    added,
    removed,
    previousRoles: currentRoles, // Keep track of all roles for reference
    newRoles: qualifyingRoles
  };
}

export async function getRoleNames(roleIds: string[]): Promise<string[]> {
  const configs = await prisma.roleConfig.findMany({
    where: {
      roleId: {
        in: roleIds
      }
    },
    select: {
      roleName: true,
      roleId: true
    }
  }) as Array<Pick<RoleConfig, 'roleName' | 'roleId'>>;
  
  // Map to role names, falling back to roleName
  return configs.map(config => config.roleName);
}

export async function syncUserRoles(discordId: string): Promise<void> {
  // Cast void return to text to avoid Prisma deserialization error
  await prisma.$executeRaw`SELECT sync_user_roles(${discordId}::text)::text`;
}
 