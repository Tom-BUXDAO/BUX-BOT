export type RoleType = 'holder' | 'whale' | 'bux' | 'top10' | 'special';

export interface RoleConfig {
  id: number;
  roleName: string;
  roleId: string;
  displayName?: string | null;
  threshold?: number | null;
  collectionName?: string | null;
  roleType: RoleType;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleStatus {
  discordId: string;
  discordName: string;
  roles: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
} 