export enum RoleType {
  NFT = 'nft',
  TOKEN = 'token',
  SPECIAL = 'special',
  WHALE = 'whale'
}

export interface RoleConfig {
  id: number;
  roleName: string;
  roleId: string;
  displayName: string | null;
  threshold: number;
  collectionName: string | null;
  roleType: RoleType;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleChanges {
  added: string[];
  removed: string[];
  previousRoles: string[];
  newRoles: string[];
}

export interface RoleSync {
  id: string;
  discordId: string;
  added: string[];
  removed: string[];
  success: boolean;
  error?: string;
  timestamp: Date;
} 