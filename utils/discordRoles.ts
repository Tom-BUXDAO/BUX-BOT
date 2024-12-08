import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { RoleUpdate } from '@/types/verification';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { prisma } from '@/lib/prisma';

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

    const newRoleNames = new Map(guild.roles.map(r => [r.id, r.name]));
    cachedRoleNames = newRoleNames;
    
    // Log managed role names for debugging
    const managedRoles = getManagedRoleIds();
    const managedRoleNames = Array.from(managedRoles).map(id => ({
      id,
      name: newRoleNames.get(id) || 'Unknown'
    }));
    console.log('Managed roles:', managedRoleNames);
    
    return newRoleNames;
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

// Create a Set of role IDs that we manage
const MANAGED_ROLE_IDS = new Set([
  // BUX roles
  '1248416679504117861', // BUX BEGINNER
  '1248417591215784019', // BUX SAVER
  '1248417674476916809', // BUX BUILDER
  '1248428373487784006', // BUX$DAO 5
  '1095363984581984357', // BUX BANKER
  // NFT Holder roles
  '1095034117877399686', // AI BITBOTS
  '1095033759612547133', // FCKED CATZ
  '1093607056696692828', // MONEY MONSTERS
  '1093607187454111825', // MONEY MONSTERS 3D
  '1095335098112561234', // CELEBCATZ
  '1300969268665389157', // CANDY BOTS
  '1300969353952362557', // DOODLE BOTS
  '1300968964276621313', // ENERGY APES
  '1300969147441610773', // RJCTD BOTS
  '1300968613179686943', // SQUIRRELS
  '1300968343783735296', // WARRIORS
  // Whale roles
  '1095033899492573274', // AI BITBOTS WHALE
  '1095033566070583457', // FCKED CATZ WHALE
  '1093606438674382858', // MONEY MONSTERS WHALE
  '1093606579355525252', // MONEY MONSTERS 3D WHALE
  // Special roles
  '1095338675224707103', // MM TOP 10
  '1095338840178294795'  // MM3D TOP 10
]);

export async function updateDiscordRoles(userId: string, roleUpdate: RoleUpdate) {
  console.log('Starting Discord role update for user:', userId);
  
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
      throw new Error('Missing Discord guild ID');
    }

    console.log('Role changes to apply:', roleUpdate);

    // Add roles
    for (const roleId of roleUpdate.added) {
      console.log(`Adding role ${roleId} to user ${userId}`);
      await rest.put(
        Routes.guildMemberRole(guildId, userId, roleId)
      );
    }

    // Remove roles
    for (const roleId of roleUpdate.removed) {
      console.log(`Removing role ${roleId} from user ${userId}`);
      await rest.delete(
        Routes.guildMemberRole(guildId, userId, roleId)
      );
    }

    console.log('Role update completed successfully');
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
}

// Add this function to map role IDs to names
async function logEnvRoleNames() {
  try {
    const guild = await rest.get(
      Routes.guild(GUILD_ID!)
    ) as { roles: { id: string, name: string }[] };

    const roleMap = new Map(guild.roles.map(r => [r.id, r.name]));
    
    // Create a mapping object for easy reference
    const roleMapping = {
      'MONSTER': roleMap.get(process.env.MONEY_MONSTERS_ROLE_ID!),
      'MONSTER 🐋': roleMap.get(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!),
      'FCKED CATZ': roleMap.get(process.env.FCKED_CATZ_ROLE_ID!),
      'FCKED CATZ 🐋': roleMap.get(process.env.FCKED_CATZ_WHALE_ROLE_ID!),
      'BITBOT': roleMap.get(process.env.AI_BITBOTS_ROLE_ID!),
      'MEGA BOT 🐋': roleMap.get(process.env.AI_BITBOTS_WHALE_ROLE_ID!),
      'MONSTER 3D': roleMap.get(process.env.MONEY_MONSTERS3D_ROLE_ID!),
      'MONSTER 3D 🐋': roleMap.get(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!),
      'CELEB': roleMap.get(process.env.CELEBCATZ_ROLE_ID!),
      'AI squirrel': roleMap.get(process.env.SQUIRRELS_ROLE_ID!),
      'AI energy ape': roleMap.get(process.env.ENERGY_APES_ROLE_ID!),
      'Rjctd bot': roleMap.get(process.env.RJCTD_BOTS_ROLE_ID!),
      'Candy bot': roleMap.get(process.env.CANDY_BOTS_ROLE_ID!),
      'Doodle bot': roleMap.get(process.env.DOODLE_BOTS_ROLE_ID!),
      'BUX$DAO 5': roleMap.get(process.env.BUXDAO_5_ROLE_ID!),
      'BUX BANKER': roleMap.get(process.env.BUX_BANKER_ROLE_ID!)
    };

    console.log('Role name mapping:', roleMapping);
    return roleMapping;
  } catch (error) {
    console.error('Error fetching role names:', error);
    return null;
  }
}

// Call this when server starts
logEnvRoleNames().then(mapping => {
  if (mapping) {
    console.log('Role mapping completed successfully');
  }
});

export function calculateQualifyingRoles(nftCounts: Record<string, number>, buxBalance: number): string[] {
  const qualifyingRoles = new Set<string>();  // Initialize the Set

  // NFT Holder roles
  if (nftCounts['ai_bitbots'] > 0) qualifyingRoles.add(process.env.AI_BITBOTS_ROLE_ID!);
  if (nftCounts['fcked_catz'] > 0) qualifyingRoles.add(process.env.FCKED_CATZ_ROLE_ID!);
  if (nftCounts['money_monsters'] > 0) qualifyingRoles.add(process.env.MONEY_MONSTERS_ROLE_ID!);
  if (nftCounts['money_monsters3d'] > 0) qualifyingRoles.add(process.env.MONEY_MONSTERS3D_ROLE_ID!);
  if (nftCounts['celebcatz'] > 0) qualifyingRoles.add(process.env.CELEBCATZ_ROLE_ID!);
  if (nftCounts['candy_bots'] > 0) qualifyingRoles.add(process.env.CANDY_BOTS_ROLE_ID!);
  if (nftCounts['doodle_bot'] > 0) qualifyingRoles.add(process.env.DOODLE_BOTS_ROLE_ID!);
  if (nftCounts['energy_apes'] > 0) qualifyingRoles.add(process.env.ENERGY_APES_ROLE_ID!);
  if (nftCounts['rjctd_bots'] > 0) qualifyingRoles.add(process.env.RJCTD_BOTS_ROLE_ID!);
  if (nftCounts['squirrels'] > 0) qualifyingRoles.add(process.env.SQUIRRELS_ROLE_ID!);
  if (nftCounts['warriors'] > 0) qualifyingRoles.add(process.env.WARRIORS_ROLE_ID!);

  // Whale roles - using thresholds from env
  if (nftCounts['ai_bitbots'] >= Number(process.env.AI_BITBOTS_WHALE_THRESHOLD)) 
    qualifyingRoles.add(process.env.AI_BITBOTS_WHALE_ROLE_ID!);
  if (nftCounts['fcked_catz'] >= Number(process.env.FCKED_CATZ_WHALE_THRESHOLD)) 
    qualifyingRoles.add(process.env.FCKED_CATZ_WHALE_ROLE_ID!);
  if (nftCounts['money_monsters'] >= Number(process.env.MONEY_MONSTERS_WHALE_THRESHOLD)) 
    qualifyingRoles.add(process.env.MONEY_MONSTERS_WHALE_ROLE_ID!);
  if (nftCounts['money_monsters3d'] >= Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD)) 
    qualifyingRoles.add(process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID!);

  // BUX roles - using thresholds from env
  if (buxBalance >= Number(process.env.BUX_BEGINNER_THRESHOLD)) 
    qualifyingRoles.add(process.env.BUX_BEGINNER_ROLE_ID!);
  if (buxBalance >= Number(process.env.BUX_BUILDER_THRESHOLD)) 
    qualifyingRoles.add(process.env.BUX_BUILDER_ROLE_ID!);
  if (buxBalance >= Number(process.env.BUX_SAVER_THRESHOLD)) 
    qualifyingRoles.add(process.env.BUX_SAVER_ROLE_ID!);
  if (buxBalance >= Number(process.env.BUX_BANKER_THRESHOLD)) 
    qualifyingRoles.add(process.env.BUX_BANKER_ROLE_ID!);
  if (buxBalance >= 100000) 
    qualifyingRoles.add(process.env.BUXDAO_5_ROLE_ID!);

  return Array.from(qualifyingRoles).filter(Boolean);  // Remove any undefined roles
}

export async function getCurrentDiscordRoles(userId: string): Promise<string[]> {
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !token) {
      console.error('Missing Discord configuration');
      throw new Error('Missing Discord configuration');
    }

    // Use the REST instance we already have configured
    const member = await rest.get(
      Routes.guildMember(guildId, userId)
    ) as { roles: string[] };

    console.log('Fetched member roles:', member.roles);
    return member.roles;
  } catch (error) {
    console.error('Error getting current Discord roles:', error);
    // Return empty array instead of throwing to handle gracefully
    return [];
  }
}

export async function calculateRoleUpdates(currentRoles: string[], qualifyingRoles: string[]): Promise<RoleUpdate> {
  // Only consider roles that we manage
  const currentManagedRoles = currentRoles.filter(id => MANAGED_ROLE_IDS.has(id));
  
  // Get role names for logging
  const roleNames = await getRoleNames();
  console.log('Current managed roles:', currentManagedRoles.map(id => roleNames.get(id) || id));
  console.log('Qualifying roles:', qualifyingRoles.map(id => roleNames.get(id) || id));
  
  const added = qualifyingRoles.filter(id => !currentManagedRoles.includes(id));
  const removed = currentManagedRoles.filter(id => !qualifyingRoles.includes(id));

  // Log role changes with names
  if (added.length > 0) {
    console.log('Adding roles:', added.map(id => roleNames.get(id) || id));
  }
  if (removed.length > 0) {
    console.log('Removing roles:', removed.map(id => roleNames.get(id) || id));
  }

  return {
    added,
    removed,
    previousRoles: currentManagedRoles,
    newRoles: qualifyingRoles
  };
}

// Update getManagedRoleIds to use our predefined set
const getManagedRoleIds = () => MANAGED_ROLE_IDS;

export async function syncUserRoles(discordId: string) {
  try {
    // Get user's Discord name
    const guild = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { user: { username: string } };

    // Get NFT holdings
    const nftHoldings = await prisma.nFT.groupBy({
      by: ['collection'],
      where: {
        ownerDiscordId: discordId
      },
      _count: true
    });

    // Get BUX balance
    const buxBalance = await prisma.tokenBalance.findFirst({
      where: {
        ownerDiscordId: discordId,
        walletAddress: {
          contains: 'bux'
        }
      },
      select: {
        balance: true
      }
    });

    // Initialize all roles as false
    const roleData = {
      discordId,
      discordName: guild.user.username,
      // NFT Holder Roles
      aiBitbotsHolder: false,
      fckedCatzHolder: false,
      moneyMonstersHolder: false,
      moneyMonsters3dHolder: false,
      celebCatzHolder: false,
      candyBotsHolder: false,
      doodleBotsHolder: false,
      energyApesHolder: false,
      rjctdBotsHolder: false,
      squirrelsHolder: false,
      warriorsHolder: false,
      // Whale Roles
      aiBitbotsWhale: false,
      fckedCatzWhale: false,
      moneyMonstersWhale: false,
      moneyMonsters3dWhale: false,
      // Special Roles
      mmTop10: false,
      mm3dTop10: false,
      // BUX Roles
      buxBanker: false,
      buxBeginner: false,
      buxSaver: false,
      buxBuilder: false,
      buxDao5: false
    };

    // Create holdings map for easier access
    const holdings = nftHoldings.reduce((acc, item) => {
      acc[item.collection] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Set NFT-based roles using correct collection names
    roleData.aiBitbotsHolder = (holdings['ai_bitbots'] || 0) > 0;
    roleData.aiBitbotsWhale = (holdings['ai_bitbots'] || 0) >= Number(process.env.AI_BITBOTS_WHALE_THRESHOLD || 10);
    
    roleData.fckedCatzHolder = (holdings['fcked_catz'] || 0) > 0;
    roleData.fckedCatzWhale = (holdings['fcked_catz'] || 0) >= Number(process.env.FCKED_CATZ_WHALE_THRESHOLD || 25);
    
    roleData.moneyMonstersHolder = (holdings['money_monsters'] || 0) > 0;
    roleData.moneyMonstersWhale = (holdings['money_monsters'] || 0) >= Number(process.env.MONEY_MONSTERS_WHALE_THRESHOLD || 25);
    
    roleData.moneyMonsters3dHolder = (holdings['money_monsters3d'] || 0) > 0;
    roleData.moneyMonsters3dWhale = (holdings['money_monsters3d'] || 0) >= Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD || 25);
    
    roleData.celebCatzHolder = (holdings['celebcatz'] || 0) > 0;
    roleData.candyBotsHolder = (holdings['candy_bots'] || 0) > 0;
    roleData.doodleBotsHolder = (holdings['doodle_bot'] || 0) > 0;
    roleData.energyApesHolder = (holdings['energy_apes'] || 0) > 0;
    roleData.rjctdBotsHolder = (holdings['rjctd_bots'] || 0) > 0;
    roleData.squirrelsHolder = (holdings['squirrels'] || 0) > 0;
    roleData.warriorsHolder = (holdings['warriors'] || 0) > 0;

    // Set BUX roles based on balance using env thresholds
    const balance = buxBalance?.balance || 0;
    roleData.buxBeginner = balance >= Number(process.env.BUX_BEGINNER_THRESHOLD || 2500);
    roleData.buxSaver = balance >= Number(process.env.BUX_SAVER_THRESHOLD || 25000);
    roleData.buxBuilder = balance >= Number(process.env.BUX_BUILDER_THRESHOLD || 10000);
    roleData.buxBanker = balance >= Number(process.env.BUX_BANKER_THRESHOLD || 50000);
    roleData.buxDao5 = balance >= 100000;

    // Log NFT counts for debugging
    console.log('NFT counts across all wallets:', nftHoldings);

    // Upsert to roles table
    await prisma.roles.upsert({
      where: { discordId },
      create: roleData,
      update: roleData
    });

    console.log(`Synced roles for user ${discordId}:`, roleData);
    return roleData;
  } catch (error) {
    console.error('Error syncing user roles:', error);
    throw error;
  }
}
 