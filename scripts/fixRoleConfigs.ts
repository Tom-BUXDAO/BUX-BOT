import { prisma } from '../lib/prisma';
import { BUX_THRESHOLDS } from '../utils/roleConfig';

// Define RoleType enum inline to avoid import issues
enum RoleType {
  NFT = 'nft',
  TOKEN = 'token',
  SPECIAL = 'special',
  WHALE = 'whale'
}

async function fixRoleConfigs() {
  try {
    console.log('Starting role config fixes...');

    // Fix NFT holder roles
    const holderRoles = [
      { roleName: 'ai_bitbots_holder', roleId: '1095034117877399686', collectionName: 'ai_bitbots' },
      { roleName: 'fcked_catz_holder', roleId: '1095033759612547133', collectionName: 'fcked_catz' },
      { roleName: 'money_monsters_holder', roleId: '1093607056696692828', collectionName: 'money_monsters' },
      { roleName: 'money_monsters3d_holder', roleId: '1093607187454111825', collectionName: 'money_monsters3d' },
      { roleName: 'celebcatz_holder', roleId: '1095335098112561234', collectionName: 'celebcatz' },
      { roleName: 'candy_bots_holder', roleId: '1300969268665389157', collectionName: 'candy_bots' },
      { roleName: 'doodle_bot_holder', roleId: '1300969353952362557', collectionName: 'doodle_bot' },
      { roleName: 'energy_apes_holder', roleId: '1300968964276621313', collectionName: 'energy_apes' },
      { roleName: 'rjctd_bots_holder', roleId: '1300969147441610773', collectionName: 'rjctd_bots' },
      { roleName: 'squirrels_holder', roleId: '1300968613179686943', collectionName: 'squirrels' },
      { roleName: 'warriors_holder', roleId: '1300968343783735296', collectionName: 'warriors' }
    ];

    for (const role of holderRoles) {
      await prisma.roleConfig.upsert({
        where: { roleName: role.roleName },
        update: {
          roleType: RoleType.NFT,
          collectionName: role.collectionName
        },
        create: {
          roleName: role.roleName,
          roleId: role.roleId,
          roleType: RoleType.NFT,
          collectionName: role.collectionName
        }
      });
    }

    // Fix whale roles with number thresholds
    const whaleRoles = [
      { roleName: 'ai_bitbots_whale', roleId: '1095033899492573274', collectionName: 'ai_bitbots', threshold: 10 },
      { roleName: 'fcked_catz_whale', roleId: '1095033566070583457', collectionName: 'fcked_catz', threshold: 25 },
      { roleName: 'money_monsters_whale', roleId: '1093606438674382858', collectionName: 'money_monsters', threshold: 25 },
      { roleName: 'money_monsters3d_whale', roleId: '1093607187454111825', collectionName: 'money_monsters3d', threshold: 25 }
    ];

    for (const role of whaleRoles) {
      await prisma.roleConfig.upsert({
        where: { roleName: role.roleName },
        update: {
          roleType: RoleType.WHALE,
          collectionName: role.collectionName,
          threshold: role.threshold
        },
        create: {
          roleName: role.roleName,
          roleId: role.roleId,
          roleType: RoleType.WHALE,
          collectionName: role.collectionName,
          threshold: role.threshold
        }
      });
    }

    // Fix BUX roles with correct thresholds (in thousands)
    const buxRoles = [
      { roleName: 'bux_banker', roleId: '1095363984581984357', threshold: BUX_THRESHOLDS.bux_banker },
      { roleName: 'bux_saver', roleId: '1248417591215784019', threshold: BUX_THRESHOLDS.bux_saver },
      { roleName: 'bux_builder', roleId: '1248417674476916809', threshold: BUX_THRESHOLDS.bux_builder },
      { roleName: 'bux_beginner', roleId: '1248416679504117861', threshold: BUX_THRESHOLDS.bux_beginner }
    ];

    for (const role of buxRoles) {
      await prisma.roleConfig.upsert({
        where: { roleName: role.roleName },
        update: {
          roleType: RoleType.TOKEN,
          threshold: role.threshold,
          collectionName: null
        },
        create: {
          roleName: role.roleName,
          roleId: role.roleId,
          roleType: RoleType.TOKEN,
          threshold: role.threshold
        }
      });
    }

    // Fix special roles
    const specialRoles = [
      { roleName: 'bux_dao_5', roleId: '1248428373487784006' },
      { roleName: 'mm_top_10', roleId: '1095338675224707103', collectionName: 'money_monsters' },
      { roleName: 'mm3d_top_10', roleId: '1095338840178294795', collectionName: 'money_monsters3d' }
    ];

    for (const role of specialRoles) {
      await prisma.roleConfig.upsert({
        where: { roleName: role.roleName },
        update: {
          roleType: RoleType.SPECIAL,
          collectionName: role.collectionName || null
        },
        create: {
          roleName: role.roleName,
          roleId: role.roleId,
          roleType: RoleType.SPECIAL,
          collectionName: role.collectionName || null
        }
      });
    }

    console.log('Role config fixes completed');

  } catch (error) {
    console.error('Error fixing role configs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleConfigs(); 