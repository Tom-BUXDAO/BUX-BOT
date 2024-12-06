import { CollectionName } from '../utils/roleConfig';

export interface RoleUpdate {
  added: string[];
  removed: string[];
  previousRoles: string[];
  newRoles: string[];
}

export interface CollectionInfo {
  count: number;
}

export interface Collections {
  [key: string]: CollectionInfo;
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