import { prisma } from '../lib/prisma';

// Define RoleType enum inline to avoid import issues
enum RoleType {
  NFT = 'nft',
  TOKEN = 'token',
  SPECIAL = 'special',
  WHALE = 'whale'
}

async function checkRoleConfig() {
  try {
    console.log('Checking role configuration...');

    // Get current role configs
    const configs = await prisma.roleConfig.findMany();
    console.log('\nCurrent role configs:', configs);

    // Define expected role mappings
    const expectedRoles = [
      // NFT Holder roles
      { roleName: 'ai_bitbots_holder', roleType: RoleType.NFT, collectionName: 'ai_bitbots' },
      { roleName: 'fcked_catz_holder', roleType: RoleType.NFT, collectionName: 'fcked_catz' },
      { roleName: 'money_monsters_holder', roleType: RoleType.NFT, collectionName: 'money_monsters' },
      { roleName: 'money_monsters3d_holder', roleType: RoleType.NFT, collectionName: 'money_monsters3d' },
      { roleName: 'celebcatz_holder', roleType: RoleType.NFT, collectionName: 'celebcatz' },
      { roleName: 'candy_bots_holder', roleType: RoleType.NFT, collectionName: 'candy_bots' },
      { roleName: 'doodle_bot_holder', roleType: RoleType.NFT, collectionName: 'doodle_bot' },
      { roleName: 'energy_apes_holder', roleType: RoleType.NFT, collectionName: 'energy_apes' },
      { roleName: 'rjctd_bots_holder', roleType: RoleType.NFT, collectionName: 'rjctd_bots' },
      { roleName: 'squirrels_holder', roleType: RoleType.NFT, collectionName: 'squirrels' },
      { roleName: 'warriors_holder', roleType: RoleType.NFT, collectionName: 'warriors' },

      // Whale roles
      { roleName: 'ai_bitbots_whale', roleType: RoleType.WHALE, collectionName: 'ai_bitbots', threshold: 10 },
      { roleName: 'fcked_catz_whale', roleType: RoleType.WHALE, collectionName: 'fcked_catz', threshold: 25 },
      { roleName: 'money_monsters_whale', roleType: RoleType.WHALE, collectionName: 'money_monsters', threshold: 25 },
      { roleName: 'money_monsters3d_whale', roleType: RoleType.WHALE, collectionName: 'money_monsters3d', threshold: 25 },

      // BUX roles
      { roleName: 'bux_banker', roleType: RoleType.TOKEN, threshold: 50000000000000 },
      { roleName: 'bux_saver', roleType: RoleType.TOKEN, threshold: 25000000000000 },
      { roleName: 'bux_builder', roleType: RoleType.TOKEN, threshold: 10000000000000 },
      { roleName: 'bux_beginner', roleType: RoleType.TOKEN, threshold: 2500000000000 },

      // Special roles
      { roleName: 'bux_dao_5', roleType: RoleType.SPECIAL },
      { roleName: 'mm_top_10', roleType: RoleType.SPECIAL },
      { roleName: 'mm3d_top_10', roleType: RoleType.SPECIAL }
    ];

    // Compare and fix role configs
    for (const expected of expectedRoles) {
      const existing = configs.find(c => c.roleName === expected.roleName);
      
      if (!existing) {
        console.log(`Missing role config for ${expected.roleName}`);
      } else if (
        existing.roleType !== expected.roleType ||
        existing.collectionName !== expected.collectionName ||
        existing.threshold !== expected.threshold
      ) {
        console.log(`Incorrect config for ${expected.roleName}:`, {
          existing,
          expected
        });
      }
    }

    // Check for unexpected roles
    const unexpectedRoles = configs.filter(
      c => !expectedRoles.find(e => e.roleName === c.roleName)
    );
    
    if (unexpectedRoles.length > 0) {
      console.log('\nUnexpected roles:', unexpectedRoles);
    }

  } catch (error) {
    console.error('Error checking role config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoleConfig(); 