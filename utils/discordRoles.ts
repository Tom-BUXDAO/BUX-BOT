import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, MAIN_COLLECTIONS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';

interface CollectionCount {
  name: CollectionName;
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
      allowedMentions: { parse: ['users', 'roles'] },
      rest: {
        timeout: 8000,
        retries: 2
      }
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
      client = null;
    });

    client.on('disconnect', () => {
      console.log('Discord client disconnected');
      client = null;
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        client = null;
        resolve();
      }, 5000);

      client!.once('ready', () => {
        clearTimeout(timeout);
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
  walletAddress: string,
  buxBalance: number
): Promise<string[]> {
  try {
    const discord = await getClient();
    const guild = await discord.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    // Get all role IDs we manage
    const managedRoleIds = getAllManagedRoleIds();
    const assignedRoles: string[] = [];

    // Batch role updates
    const rolesToAdd: string[] = [];
    const rolesToRemove = member.roles.cache.filter(role => managedRoleIds.includes(role.id));

    // Remove all managed roles first
    await Promise.all(Array.from(rolesToRemove.values()).map(async role => {
      await member.roles.remove(role);
      console.log(`Removed role: ${role.name}`);
    }));

    // Add NFT collection roles
    for (const collection of collections) {
      const config = NFT_THRESHOLDS[collection.name];
      if (!config) continue;

      if (config.holder) {
        rolesToAdd.push(config.holder);
        console.log(`Adding holder role for ${collection.name}`);
      }

      if ('whale' in config && config.whale?.roleId && collection.count >= config.whale.threshold) {
        rolesToAdd.push(config.whale.roleId);
        console.log(`Adding whale role for ${collection.name}`);
      }
    }

    // Add BUX balance roles in ascending order
    const sortedBuxThresholds = [...BUX_THRESHOLDS].sort((a, b) => b.threshold - a.threshold);
    let buxRoleAssigned = false;

    for (const threshold of sortedBuxThresholds) {
      if (threshold.roleId && buxBalance >= threshold.threshold) {
        rolesToAdd.push(threshold.roleId);
        console.log(`Adding BUX role for balance ${buxBalance} >= ${threshold.threshold}`);
        buxRoleAssigned = true;
        break; // Only assign the highest qualifying role
      }
    }

    if (!buxRoleAssigned) {
      console.log(`No BUX roles assigned for balance: ${buxBalance}`);
    }

    // Add BUXDAO 5 role if qualified
    const mainCollectionHoldings = MAIN_COLLECTIONS.map(name => 
      collections.find(c => c.name === name)
    );
    
    if (mainCollectionHoldings.every(h => h) && BUXDAO_5_ROLE_ID) {
      rolesToAdd.push(BUXDAO_5_ROLE_ID);
    }

    // Batch add roles
    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
      const addedRoles = await Promise.all(
        rolesToAdd.map(async id => {
          const role = await guild.roles.fetch(id);
          if (role) assignedRoles.push(role.name);
          return role?.name;
        })
      );
      console.log('Added roles:', addedRoles.filter(Boolean));
    }

    return assignedRoles;

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    client = null;
    return [];
  }
}

function getAllManagedRoleIds(): string[] {
  const roleIds = new Set<string>();

  Object.values(NFT_THRESHOLDS).forEach(config => {
    if (config.holder) roleIds.add(config.holder);
    if ('whale' in config && config.whale?.roleId) {
      roleIds.add(config.whale.roleId);
    }
  });

  BUX_THRESHOLDS.forEach(threshold => {
    if (threshold.roleId) roleIds.add(threshold.roleId);
  });

  if (BUXDAO_5_ROLE_ID) roleIds.add(BUXDAO_5_ROLE_ID);

  return Array.from(roleIds).filter((id): id is string => id !== undefined);
} 