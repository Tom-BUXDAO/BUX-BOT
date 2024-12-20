import { prisma } from '../lib/prisma';
import { RoleConfig, RoleType } from '../types/roles';

function formatRoleName(roleName: string): string {
  return roleName.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export async function getRoleConfigs(): Promise<RoleConfig[]> {
  const configs = await prisma.roleConfig.findMany({
    orderBy: { id: 'asc' }
  });
  
  return configs.map(config => ({
    ...config,
    roleType: config.roleType as RoleType,
    displayName: config.displayName || formatRoleName(config.roleName)
  }));
}

export async function getRoleConfig(roleName: string): Promise<RoleConfig | null> {
  const config = await prisma.roleConfig.findUnique({
    where: { roleName }
  });

  if (!config) return null;

  return {
    ...config,
    roleType: config.roleType as RoleType,
    displayName: config.displayName || formatRoleName(config.roleName)
  };
}

export async function getRoleIdByName(roleName: string): Promise<string | null> {
  const config = await prisma.roleConfig.findUnique({
    where: { roleName }
  });
  return config?.roleId ?? null;
}

export async function getThresholdByName(roleName: string): Promise<number | null> {
  const config = await prisma.roleConfig.findUnique({
    where: { roleName }
  });
  return config?.threshold ?? null;
}

export async function getRolesByType(type: RoleType): Promise<RoleConfig[]> {
  const configs = await prisma.roleConfig.findMany({
    where: { roleType: type }
  });
  
  return configs.map(config => ({
    ...config,
    roleType: config.roleType as RoleType,
    displayName: formatRoleName(config.roleName)
  }));
}

export async function getRolesByCollection(collectionName: string): Promise<RoleConfig[]> {
  const configs = await prisma.roleConfig.findMany({
    where: { collectionName }
  });
  
  return configs.map(config => ({
    ...config,
    roleType: config.roleType as RoleType,
    displayName: formatRoleName(config.roleName)
  }));
}

export async function getRoleDisplayName(roleName: string): Promise<string | null> {
  const config = await prisma.roleConfig.findUnique({
    where: { roleName }
  });
  return config ? formatRoleName(config.roleName) : null;
}

export const MAIN_COLLECTIONS = [
  'ai_bitbots',
  'fcked_catz', 
  'money_monsters',
  'money_monsters3d',
  'celebcatz'
] as const;

export type CollectionName = 
  | typeof MAIN_COLLECTIONS[number]
  | 'candy_bots'
  | 'doodle_bot'
  | 'energy_apes'
  | 'rjctd_bots'
  | 'squirrels'
  | 'warriors';

export const NFT_THRESHOLDS = {
  ai_bitbots: 10,
  fcked_catz: 25,
  money_monsters: 25,
  money_monsters3d: 25,
  celebcatz: 0,
  candy_bots: 0,
  doodle_bot: 0,
  energy_apes: 0,
  rjctd_bots: 0,
  squirrels: 0,
  warriors: 0
} as const;

export const BUX_THRESHOLDS = {
  bux_banker: 50000,
  bux_saver: 25000,
  bux_builder: 10000,
  bux_beginner: 2500
} as const;

export const BUXDAO_5_ROLE_ID = '1248428373487784006'; 

export function calculateRoles(tokenBalances: any[], nftHoldings: any[], roleConfig: any[]) {
  const roles: Record<string, boolean> = {};
  
  // Initialize all roles to false
  roleConfig.forEach(config => {
    roles[config.roleName] = false;
  });

  // Calculate NFT roles
  for (const config of roleConfig) {
    if (config.roleType === 'NFT') {
      const holdingCount = nftHoldings.filter(h => h.collection === config.collection).length;
      roles[config.roleName] = holdingCount >= config.threshold;
    }
  }

  // Calculate token roles
  const totalBux = tokenBalances.reduce((sum, b) => sum + b.amount, 0);
  for (const config of roleConfig) {
    if (config.roleType === 'TOKEN') {
      roles[config.roleName] = totalBux >= config.threshold;
    }
  }

  // Calculate BUXDao5
  const hasMainCollections = roleConfig
    .filter(c => c.isMainCollection)
    .every(c => roles[c.roleName]);
  roles.buxDao5 = hasMainCollections;

  return roles;
}