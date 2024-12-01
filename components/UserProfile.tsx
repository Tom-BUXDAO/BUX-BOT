import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaSignOutAlt, FaBars, FaWallet, FaCoins, FaPaintBrush } from 'react-icons/fa';
import styles from '@/styles/UserProfile.module.css';
import Image from 'next/image';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

interface VerifyResult {
  isHolder: boolean;
  collections: Array<{
    name: string;
    count: number;
  }>;
  buxBalance: number;
  totalNFTs: number;
  totalValue: number;
  assignedRoles?: string[];
}

interface MenuItem {
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}

const BUX_DECIMALS = 9;

interface UserProfileProps {
  walletAddress: string;
}

export default function UserProfile({ walletAddress }: UserProfileProps) {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();

  // Format BUX balance directly from verifyResult
  const buxBalance = verifyResult?.buxBalance || 0;
  const formattedBalance = buxBalance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt="Profile"
            width={48}
            height={48}
            className={styles.avatar}
          />
        )}
        <div className={styles.info}>
          <div className={styles.name}>{session?.user?.name}</div>
          <div className={styles.balance}>{formattedBalance} BUX</div>
        </div>
      </div>
    </div>
  );
} 