import { CollectionName } from '../utils/roleConfig';

export interface RoleUpdate {
  added: string[];
  removed: string[];
  previousRoles: string[];
  newRoles: string[];
}

export interface CollectionCount {
  count: number;
}

export interface Collections {
  [collection: string]: CollectionCount;
}

export interface VerificationResult {
  isHolder: boolean;
  collections: Collections;
  buxBalance: number;
  totalNFTs: number;
  assignedRoles: string[];
  qualifyingBuxRoles: string[];
  roleUpdate: {
    added: string[];
    removed: string[];
    previousRoles: string[];
    newRoles: string[];
  };
}

export interface WalletVerification {
  id: string;
  walletAddress: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  result: VerificationResult | null;
} 