export interface RoleUpdate {
  added: string[];
  removed: string[];
}

export interface VerifyResult {
  isHolder: boolean;
  collections: Array<{
    name: string;
    count: number;
  }>;
  buxBalance: number;
  totalNFTs: number;
  totalValue: number;
  assignedRoles: string[];
  roleUpdate?: RoleUpdate;
} 