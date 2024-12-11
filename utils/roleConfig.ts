import { prisma } from '@/lib/prisma';
import type { RoleConfig, RoleType } from '@/types/roles';

export async function getRoleConfigs(): Promise<RoleConfig[]> {
  const configs = await prisma.roleConfig.findMany({
    orderBy: [
      { roleType: 'asc' },
      { displayName: 'asc' }
    ]
  });
  
  return configs.map(config => ({
    ...config,
    roleType: config.roleType as RoleType
  }));
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

export async function getRolesByType(type: string): Promise<RoleConfig[]> {
  return prisma.roleConfig.findMany({
    where: { roleType: type }
  });
}

export async function getRolesByCollection(collectionName: string): Promise<RoleConfig[]> {
  return prisma.roleConfig.findMany({
    where: { collectionName }
  });
}

export async function getRoleDisplayName(roleName: string): Promise<string | null> {
  const config = await prisma.roleConfig.findUnique({
    where: { roleName }
  });
  return config?.displayName ?? config?.roleName ?? null;
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