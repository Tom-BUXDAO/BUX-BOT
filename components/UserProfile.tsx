import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaSignOutAlt, FaBars, FaWallet, FaCoins, FaPaintBrush } from 'react-icons/fa';
import styles from '@/styles/UserProfile.module.css';
import Image from 'next/image';

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

export default function UserProfile({ walletAddress }: { walletAddress: string }) {
  const { data: session, status } = useSession();
  const { disconnect } = useWallet();
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Menu items configuration
  const menuItems: MenuItem[] = [
    {
      label: 'Verify Holder',
      icon: <FaWallet className={styles.menuIcon} />,
      onClick: () => {
        verifyWallet();
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

  const verifyWallet = useCallback(async () => {
    if (!walletAddress || !session?.user?.id || status !== 'authenticated') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (response.status === 401) {
        await signOut({ redirect: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to verify wallet');
      }

      const result = await response.json();
      setVerifyResult(result);
    } catch (err) {
      console.error('Error verifying wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify wallet');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, session?.user?.id, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      verifyWallet();
    }
  }, [verifyWallet, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const interval = setInterval(verifyWallet, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [verifyWallet, status]);

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