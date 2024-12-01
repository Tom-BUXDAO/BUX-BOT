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

interface UserProfileProps {
  walletAddress: string;
}

export default function UserProfile({ walletAddress }: UserProfileProps) {
  const { data: session, status } = useSession();
  const { disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const wallet = useWallet();
  const { verifyResult, verifyWallet: contextVerifyWallet } = useWalletVerification();

  const menuItems: MenuItem[] = [
    {
      label: 'Verify Holder',
      icon: <FaWallet className={styles.menuIcon} />,
      onClick: () => {
        contextVerifyWallet(walletAddress);
        setShowMenu(false);
      }
    },
    {
      label: 'Sign Out',
      icon: <FaSignOutAlt className={styles.menuIcon} />,
      onClick: async () => {
        if (wallet.connected) {
          await disconnect();
        }
        await signOut();
        setShowMenu(false);
      }
    }
  ];

  useEffect(() => {
    if (status === 'authenticated' && walletAddress) {
      contextVerifyWallet(walletAddress);
    }
  }, [contextVerifyWallet, status, walletAddress]);

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
          <div className={styles.balance}>{verifyResult?.buxBalance?.toLocaleString()} BUX</div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={styles.menuButton}
          title="Toggle menu"
          aria-label="Toggle profile menu"
        >
          <FaBars />
        </button>
      </div>
      {showMenu && (
        <div className={styles.menu}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={styles.menuItem}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 