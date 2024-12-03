export interface RoleUpdate {
  added: string[];
  removed: string[];
}

export interface VerificationResult {
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

export interface WalletVerification {
  id: string;
  walletAddress: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  result: VerificationResult | null;
} 