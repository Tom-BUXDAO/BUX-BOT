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
  const { data: session, status } = useSession();
  const { disconnect } = useWallet();
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const wallet = useWallet();
  const { verifyWallet: contextVerifyWallet } = useWalletVerification();

  // Menu items configuration
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
      label: 'BUX Token Info',
      icon: <FaCoins className={styles.menuIcon} />,
      onClick: () => {
        // TODO: Implement BUX token info modal
        console.log('Show BUX token info');
        setShowMenu(false);
      }
    },
    {
      label: 'NFT Holdings',
      icon: <FaPaintBrush className={styles.menuIcon} />,
      onClick: () => {
        // TODO: Implement NFT holdings modal
        console.log('Show NFT holdings');
        setShowMenu(false);
      }
    }
  ];

  useEffect(() => {
    if (status === 'authenticated' && walletAddress) {
      contextVerifyWallet(walletAddress);
    }
  }, [contextVerifyWallet, status, walletAddress]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const interval = setInterval(contextVerifyWallet, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [contextVerifyWallet, status]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      console.log('Wallet connected, verifying...', wallet.publicKey.toString());
      contextVerifyWallet(wallet.publicKey.toString());
    }
  }, [wallet.connected, wallet.publicKey, contextVerifyWallet]);

  const handleLogout = async () => {
    await disconnect();
    await signOut({ redirect: false });
  };

  const formatBuxBalance = (rawBalance: number) => {
    return (rawBalance / Math.pow(10, BUX_DECIMALS)).toLocaleString();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('profile-menu');
      if (menu && !menu.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) return null;

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            width={40}
            height={40}
            className={styles.avatar}
          />
        )}
        <div className={styles.info}>
          <p className={styles.name}>{session.user.name}</p>
          <p className={styles.balance}>
            {loading ? (
              'Verifying...'
            ) : error ? (
              <span className={styles.error}>{error}</span>
            ) : (
              `${formatBuxBalance(verifyResult?.buxBalance ?? 0)} BUX`
            )}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={styles.menuButton}
          title="Menu"
        >
          <FaBars />
        </button>
        <button 
          onClick={handleLogout}
          className={styles.logoutButton}
          title="Logout"
        >
          <FaSignOutAlt />
        </button>
      </div>

      {showMenu && (
        <div id="profile-menu" className={styles.menu}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={styles.menuItem}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 