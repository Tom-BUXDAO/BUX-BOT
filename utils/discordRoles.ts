import { Client, GuildMember, GatewayIntentBits, Role } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const RATE_LIMIT_DELAY = 1000;

// Create a singleton client with proper intents
let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (!client) {
    client = new Client({ 
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages
      ],
      rest: {
        timeout: 60000,
        retries: 3
      }
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      client!.once('ready', () => resolve());
    });
  }

  return client;
}

export async function updateDiscordRoles(discordId: string, assignedRoles: string[]) {
  try {
    const client = await getClient();
    const guild = await client.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    // Get ALL current roles
    const currentRoles = member.roles.cache.map((role: Role) => role.id);
    console.log('Current Discord roles:', currentRoles);

    // Get list of roles we manage
    const managedRoleIds = [
      process.env.BUX_BANKER_ROLE_ID,
      process.env.BUX_SAVER_ROLE_ID,
      process.env.BUX_BUILDER_ROLE_ID,
      process.env.BUX_BEGINNER_ROLE_ID,
      process.env.MONEY_MONSTERS3D_ROLE_ID,
      process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID,
      process.env.AI_BITBOTS_ROLE_ID,
      process.env.AI_BITBOTS_WHALE_ROLE_ID,
      process.env.CANDY_BOTS_ROLE_ID,
      process.env.FCKED_CATZ_ROLE_ID,
      process.env.FCKED_CATZ_WHALE_ROLE_ID,
      process.env.SQUIRRELS_ROLE_ID,
      process.env.ENERGY_APES_ROLE_ID,
      process.env.BUXDAO_5_ROLE_ID
    ].filter(Boolean) as string[];

    console.log('Managed role IDs:', managedRoleIds);

    // If no roles assigned, remove all managed roles
    if (assignedRoles.length === 0) {
      const rolesToRemove = currentRoles.filter(role => managedRoleIds.includes(role));
      console.log('Removing all managed roles:', rolesToRemove);

      for (const roleId of rolesToRemove) {
        try {
          await member.roles.remove(roleId);
          console.log(`Removed role ${roleId} from ${discordId}`);
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        } catch (error) {
          console.error(`Error removing role ${roleId}:`, error);
        }
      }

      return {
        added: [],
        removed: rolesToRemove,
        previousRoles: currentRoles,
        newRoles: member.roles.cache.map((role: Role) => role.id)
      };
    }

    // Normal role updates if roles are assigned
    const rolesToRemove = currentRoles.filter(role => 
      managedRoleIds.includes(role) && !assignedRoles.includes(role)
    );

    const rolesToAdd = assignedRoles.filter(role => 
      managedRoleIds.includes(role) && !currentRoles.includes(role)
    );

    console.log('Roles to remove:', rolesToRemove);
    console.log('Roles to add:', rolesToAdd);

    // Process removals
    for (const roleId of rolesToRemove) {
      try {
        await member.roles.remove(roleId);
        console.log(`Removed role ${roleId} from ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error removing role ${roleId}:`, error);
      }
    }

    // Process additions
    for (const roleId of rolesToAdd) {
      try {
        await member.roles.add(roleId);
        console.log(`Added role ${roleId} to ${discordId}`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`Error adding role ${roleId}:`, error);
      }
    }

    // Get final state
    const finalRoles = member.roles.cache.map((role: Role) => role.id);

    return {
      added: rolesToAdd,
      removed: rolesToRemove,
      previousRoles: currentRoles,
      newRoles: finalRoles
    };
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 