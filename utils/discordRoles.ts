import { Client, GuildMember, Intents } from 'discord.js';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, MAIN_COLLECTIONS, BUXDAO_5_ROLE_ID } from './roleConfig';

interface CollectionCount {
  name: string;
  count: number;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Get all role IDs that we manage
const getAllManagedRoleIds = () => {
  const roleIds = new Set<string>();

  // Add all collection holder roles
  Object.values(NFT_THRESHOLDS).forEach(config => {
    if (config.holder) roleIds.add(config.holder);
    if (config.whale?.roleId) roleIds.add(config.whale.roleId);
  });

  // Add BUX token roles
  BUX_THRESHOLDS.forEach(threshold => {
    if (threshold.roleId) roleIds.add(threshold.roleId);
  });

  // Add BUXDAO 5 role
  if (BUXDAO_5_ROLE_ID) roleIds.add(BUXDAO_5_ROLE_ID);

  return Array.from(roleIds);
};

const client = new Client({ 
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS
  ] 
});

export async function updateDiscordRoles(discordId: string, collections: CollectionCount[]) {
  try {
    if (!client.isReady()) {
      await client.login(DISCORD_BOT_TOKEN);
    }

    const guild = await client.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    if (!member) {
      throw new Error('Member not found');
    }

    // Get all role IDs we manage
    const managedRoleIds = getAllManagedRoleIds();

    // Remove all managed roles first
    console.log('Removing existing roles...');
    await Promise.all(
      member.roles.cache
        .filter(role => managedRoleIds.includes(role.id))
        .map(role => {
          console.log(`Removing role: ${role.name}`);
          return member.roles.remove(role);
        })
    );

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
      }
    }

    // Handle collection roles
    for (const collection of collections) {
      const config = NFT_THRESHOLDS[collection.name as keyof typeof NFT_THRESHOLDS];
      if (!config) continue;

      // Add holder role
      if (config.holder) {
        console.log(`Adding holder role for ${collection.name}`);
        const role = await guild.roles.fetch(config.holder);
        if (role) await member.roles.add(role);
      }

      // Add whale role if applicable
      if (config.whale && collection.count >= config.whale.threshold) {
        console.log(`Adding whale role for ${collection.name}`);
        const whaleRole = await guild.roles.fetch(config.whale.roleId);
        if (whaleRole) await member.roles.add(whaleRole);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    return false;
  }
} 