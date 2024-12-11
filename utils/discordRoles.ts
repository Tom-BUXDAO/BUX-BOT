import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { RoleUpdate } from '@/types/verification';
import { prisma } from '@/lib/prisma';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN!);

export async function updateDiscordRoles(userId: string, roleUpdate: RoleUpdate) {
  console.log('Starting Discord role update for user:', userId);
  
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
      throw new Error('Missing Discord guild ID');
    }

    // Add roles
    for (const roleId of roleUpdate.added) {
      await rest.put(Routes.guildMemberRole(guildId, userId, roleId));
    }

    // Remove roles
    for (const roleId of roleUpdate.removed) {
      await rest.delete(Routes.guildMemberRole(guildId, userId, roleId));
    }
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
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
      // Check if user has the corresponding flag in Roles table
      const flagName = config.roleName.replace(/[^a-zA-Z]/g, '').toLowerCase();
      return roles[flagName as keyof typeof roles] === true;
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
 