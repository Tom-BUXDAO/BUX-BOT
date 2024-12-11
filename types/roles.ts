export enum RoleType {
  NFT = 'nft',
  TOKEN = 'token',
  SPECIAL = 'special',
  WHALE = 'whale'
}

export interface RoleConfig {
  id: number;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  roleName: string;
  roleId: string;
  threshold: number | null;
  collectionName: string | null;
  roleType: RoleType;
}

export interface RoleStatus {
  discordId: string;
  discordName: string;
  roles: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
} 