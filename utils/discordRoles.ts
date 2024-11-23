import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, MAIN_COLLECTIONS, BUXDAO_5_ROLE_ID } from './roleConfig';

interface CollectionCount {
  name: string;
  count: number;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ] 
});

const BUX_TOKEN_ADDRESS = 'FMiRxSbLqRTWiBszt1DZmXd7SrscWCccY7fcXNtwWxHK';

export async function updateDiscordRoles(
  discordId: string, 
  collections: CollectionCount[],
  walletAddress: string
): Promise<string[]> {
  try {
    console.log('Starting role update for Discord ID:', discordId);
    console.log('Bot token available:', !!DISCORD_BOT_TOKEN);
    console.log('Guild ID:', GUILD_ID);

    if (!client.isReady()) {
      console.log('Client not ready, logging in...');
      await client.login(DISCORD_BOT_TOKEN);
      console.log('Client logged in successfully');
    }

    console.log('Fetching guild...');
    const guild = await client.guilds.fetch(GUILD_ID!);
    console.log('Guild fetched:', guild.name);

    console.log('Fetching member...');
    const member = await guild.members.fetch(discordId);
    console.log('Member fetched:', member.user.tag);

    // Get all role IDs we manage
    const managedRoleIds = getAllManagedRoleIds();
    console.log('Managed role IDs:', managedRoleIds);

    // Remove all managed roles first
    console.log('Current roles:', member.roles.cache.map(r => r.name));
    const rolesToRemove = member.roles.cache.filter(role => managedRoleIds.includes(role.id));
    console.log('Roles to remove:', rolesToRemove.map(r => r.name));

    for (const role of rolesToRemove.values()) {
      console.log(`Removing role: ${role.name}`);
      try {
        await member.roles.remove(role);
        console.log(`Successfully removed role: ${role.name}`);
      } catch (error) {
        console.error(`Error removing role ${role.name}:`, error);
      }
    }

    const assignedRoles: string[] = [];

    // Check for BUXDAO 5 qualification
    const mainCollectionHoldings = MAIN_COLLECTIONS.map(collectionName => 
      collections.find(c => c.name === collectionName)
    );
    
    const qualifiesForBuxdao5 = mainCollectionHoldings.every(holding => holding !== undefined);
    
    if (qualifiesForBuxdao5 && BUXDAO_5_ROLE_ID) {
      console.log('Qualifies for BUXDAO 5 role');
      const buxdao5Role = await guild.roles.fetch(BUXDAO_5_ROLE_ID);
      if (buxdao5Role) {
        await member.roles.add(buxdao5Role);
        assignedRoles.push(buxdao5Role.name);
        console.log(`Successfully added BUXDAO 5 role: ${buxdao5Role.name}`);
      }
    }

    // Get BUX balance
    try {
      const response = await fetch(
        `https://api.shyft.to/sol/v1/wallet/token_balance?network=mainnet-beta&wallet=${walletAddress}&token=${BUX_TOKEN_ADDRESS}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_SHYFT_API_KEY || '',
          },
        }
      );

      const data = await response.json();
      if (data.success && data.result) {
        const buxBalance = parseFloat(data.result.balance);
        
        // Assign BUX roles in descending order
        for (const threshold of BUX_THRESHOLDS.sort((a, b) => b.threshold - a.threshold)) {
          if (buxBalance >= threshold.threshold && threshold.roleId) {
            const role = await guild.roles.fetch(threshold.roleId);
            if (role) {
              await member.roles.add(role);
              assignedRoles.push(role.name);
              console.log(`Added BUX role: ${role.name}`);
              break; // Only assign the highest tier role
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking BUX balance:', error);
    }

    // Add NFT collection roles (including collabs)
    for (const collection of collections) {
      const config = NFT_THRESHOLDS[collection.name as keyof typeof NFT_THRESHOLDS];
      if (!config) continue;

      if (config.holder) {
        try {
          const role = await guild.roles.fetch(config.holder);
          if (role) {
            await member.roles.add(role);
            assignedRoles.push(role.name);
            console.log(`Successfully added holder role: ${role.name}`);
          }
        } catch (error) {
          console.error(`Error adding holder role for ${collection.name}:`, error);
        }
      }

      // Add whale role if applicable
      if (config.whale?.roleId && collection.count >= (config.whale?.threshold || 0)) {
        try {
          const whaleRole = await guild.roles.fetch(config.whale.roleId);
          if (whaleRole) {
            await member.roles.add(whaleRole);
            assignedRoles.push(whaleRole.name);
            console.log(`Successfully added whale role: ${whaleRole.name}`);
          }
        } catch (error) {
          console.error(`Error adding whale role for ${collection.name}:`, error);
        }
      }
    }

    console.log('Role update completed successfully');
    console.log('Assigned roles:', assignedRoles);
    return assignedRoles;
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    return [];
  }
}

// Helper function to get all role IDs we manage
function getAllManagedRoleIds() {
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