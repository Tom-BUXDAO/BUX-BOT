import { RoleUpdate } from '../types/discord';
import { prisma } from '../lib/prisma';
import { getDiscordClient } from './discord';
import { rest, GUILD_ID } from './discord';
import { Routes } from 'discord-api-types/v10';

export async function updateDiscordRoles(discordId: string, roleUpdate: RoleUpdate) {
  try {
    const discord = await getDiscordClient();
    const guild = await discord.guilds.fetch(process.env.DISCORD_GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    console.log(`Applying Discord role updates for ${discordId}`);

    // Get protected roles that shouldn't be modified
    const protectedRoles = new Set(['949022529551495248']); // Server Booster role

    // Filter out protected roles from removal
    const rolesToRemove = roleUpdate.removed.filter(roleId => !protectedRoles.has(roleId));

    // Apply role changes
    await Promise.all([
      ...roleUpdate.added.map(roleId => 
        member.roles.add(roleId).catch((error: Error) => 
          console.error(`Failed to add role ${roleId}:`, error)
        )
      ),
      ...rolesToRemove.map(roleId => 
        member.roles.remove(roleId).catch((error: Error) => 
          console.error(`Failed to remove role ${roleId}:`, error)
        )
      )
    ]);

    // Log sync result using raw query
    await prisma.$executeRaw`
      INSERT INTO "RoleSync" (id, "discordId", added, removed, success, timestamp)
      VALUES (gen_random_uuid(), ${discordId}, ${roleUpdate.added}, ${rolesToRemove}, true, NOW())
    `;

    return true;
  } catch (error) {
    console.error('Error in updateDiscordRoles:', error);
    
    // Log failed sync using raw query
    await prisma.$executeRaw`
      INSERT INTO "RoleSync" (id, "discordId", added, removed, success, error, timestamp)
      VALUES (
        gen_random_uuid(), 
        ${discordId}, 
        ${roleUpdate.added}, 
        ${roleUpdate.removed}, 
        false,
        ${error instanceof Error ? error.message : 'Unknown error'},
        NOW()
      )
    `;

    throw error;
  }
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

export async function syncUserRoles(discordId: string): Promise<void> {
  // Call database function to sync roles
  await prisma.$executeRaw`SELECT sync_user_roles(${discordId}::text)`;
}
 