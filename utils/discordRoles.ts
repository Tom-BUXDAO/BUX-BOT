import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, MAIN_COLLECTIONS, BUXDAO_5_ROLE_ID } from './roleConfig';

interface CollectionCount {
  name: string;
  count: number;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

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
      allowedMentions: { parse: ['users', 'roles'] }
    });

    // Add error handlers
    client.on('error', (error) => {
      console.error('Discord client error:', error);
      client = null; // Reset client on error
    });

    client.on('disconnect', () => {
      console.log('Discord client disconnected');
      client = null;
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  // Wait for client to be ready
  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      client!.once('ready', () => {
        console.log('Discord client ready');
        resolve();
      });
    });
  }

  return client;
}

export async function updateDiscordRoles(
  discordId: string, 
  collections: CollectionCount[],
  walletAddress: string
): Promise<string[]> {
  try {
    const discord = await getClient();
    const guild = await discord.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    // Get all role IDs we manage
    const managedRoleIds = getAllManagedRoleIds();

    // Remove all managed roles first
    const rolesToRemove = member.roles.cache.filter(role => managedRoleIds.includes(role.id));
    for (const role of rolesToRemove.values()) {
      await member.roles.remove(role);
      console.log(`Removed role: ${role.name}`);
    }

    const assignedRoles: string[] = [];

    // Add NFT collection roles
    for (const collection of collections) {
      const config = NFT_THRESHOLDS[collection.name];
      if (!config) continue;

      if (config.holder) {
        const role = await guild.roles.fetch(config.holder);
        if (role) {
          await member.roles.add(role);
          assignedRoles.push(role.name);
          console.log(`Added holder role: ${role.name}`);
        }
      }

      // Add whale role if applicable
      if (config.whale?.roleId && collection.count >= config.whale.threshold) {
        const whaleRole = await guild.roles.fetch(config.whale.roleId);
        if (whaleRole) {
          await member.roles.add(whaleRole);
          assignedRoles.push(whaleRole.name);
          console.log(`Added whale role: ${whaleRole.name}`);
        }
      }
    }

    // Add BUXDAO 5 role if qualified
    const mainCollectionHoldings = MAIN_COLLECTIONS.map(name => 
      collections.find(c => c.name === name)
    );
    
    if (mainCollectionHoldings.every(h => h) && BUXDAO_5_ROLE_ID) {
      const buxdao5Role = await guild.roles.fetch(BUXDAO_5_ROLE_ID);
      if (buxdao5Role) {
        await member.roles.add(buxdao5Role);
        assignedRoles.push(buxdao5Role.name);
      }
    }

    console.log('Role update completed successfully');
    console.log('Assigned roles:', assignedRoles);
    return assignedRoles;

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    // Reset client on error
    client = null;
    return [];
  }
}

function getAllManagedRoleIds(): string[] {
  const roleIds = new Set<string>();

  Object.values(NFT_THRESHOLDS).forEach(config => {
    if (config.holder) roleIds.add(config.holder);
    if (config.whale?.roleId) roleIds.add(config.whale.roleId);
  });

  BUX_THRESHOLDS.forEach(threshold => {
    if (threshold.roleId) roleIds.add(threshold.roleId);
  });

  if (BUXDAO_5_ROLE_ID) roleIds.add(BUXDAO_5_ROLE_ID);

  return Array.from(roleIds).filter((id): id is string => id !== undefined);
} 