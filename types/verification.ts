import { CollectionName } from '../utils/roleConfig';

export interface RoleUpdate {
  added: string[];
  removed: string[];
  previousRoles: string[];
  newRoles: string[];
}

export interface CollectionInfo {
  name: string;
  count: number;
  isWhale: boolean;
}

export interface VerificationResult {
  isHolder: boolean;
  collections: CollectionInfo[];
  buxBalance: number;
  totalNFTs: number;
  assignedRoles: string[];
  roleUpdate: RoleUpdate;
  qualifyingBuxRoles: string[];
}

export interface WalletVerification {
  id: string;
  walletAddress: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  result: VerificationResult | null;
} 