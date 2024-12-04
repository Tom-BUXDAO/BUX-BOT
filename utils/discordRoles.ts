import { Client, GuildMember, GatewayIntentBits } from 'discord.js';

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const RATE_LIMIT_DELAY = 1000;

// Keep REST API for role verification
async function getGuildRoles(): Promise<Record<string, string>> {
  const response = await fetch(
    `${DISCORD_API}/guilds/${GUILD_ID}/roles`,
    {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch guild roles');
  }

  const roles = await response.json();
  return roles.reduce((acc: Record<string, string>, role: any) => {
    acc[role.id] = role.name;
    return acc;
  }, {});
}

export async function updateDiscordRoles(discordId: string, newRoles: string[]) {
  try {
    // Get current member roles
    const memberResponse = await fetch(
      `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!memberResponse.ok) {
      throw new Error('Failed to fetch member roles');
    }

    const memberData = await memberResponse.json();
    const currentRoles: string[] = memberData.roles || [];
    const roleNames = await getGuildRoles();

    // Get managed role IDs
    const managedRoleIds = Object.values(process.env)
      .filter(id => id && typeof id === 'string' && id.match(/^\d{17,19}$/))
      .map(id => id as string);

    // Remove managed roles first
    const rolesToRemove = currentRoles.filter(roleId => managedRoleIds.includes(roleId));
    for (const roleId of rolesToRemove) {
      try {
        await fetch(
          `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`
            }
          }
        );
        console.log(`Successfully removed role ${roleId} (${roleNames[roleId]}) from ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error removing role ${roleId}:`, error);
      }
    }

    // Add new roles
    const rolesToAdd = newRoles.filter(roleId => !currentRoles.includes(roleId));
    for (const roleId of rolesToAdd) {
      try {
        await fetch(
          `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`
            }
          }
        );
        console.log(`Successfully added role ${roleId} (${roleNames[roleId]}) to ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error adding role ${roleId}:`, error);
      }
    }

    return {
      added: rolesToAdd.map(id => roleNames[id] || id),
      removed: rolesToRemove.map(id => roleNames[id] || id),
      previousRoles: currentRoles.map(id => roleNames[id] || id),
      newRoles: newRoles.map(id => roleNames[id] || id)
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 