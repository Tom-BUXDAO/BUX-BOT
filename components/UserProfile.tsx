import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaSignOutAlt } from 'react-icons/fa';
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

interface BuxBalance {
  balance: number;
  loading: boolean;
  error: string | null;
}

export default function UserProfile({ walletAddress }: { walletAddress: string }) {
  const { data: session } = useSession();
  const { disconnect } = useWallet();
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buxBalance, setBuxBalance] = useState<BuxBalance>({
    balance: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    async function verifyWallet() {
      if (!walletAddress) {
        setVerifyResult(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/update-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            discordId: session?.user?.discordId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify wallet');
        }

        const result = await response.json();
        console.log('Verify result:', result);
        setVerifyResult(result);
      } catch (err) {
        console.error('Error verifying wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify wallet');
        setVerifyResult(null);
      } finally {
        setLoading(false);
      }
    }

    verifyWallet();
  }, [walletAddress, session?.user?.discordId]);

  useEffect(() => {
    const fetchBuxBalance = async () => {
      if (!walletAddress) return;
      
      try {
        setBuxBalance(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch(`/api/balance?wallet=${walletAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch BUX balance');
        }

        const data = await response.json();
        setBuxBalance({
          balance: data.balance,
          loading: false,
          error: null
        });
      } catch (error) {
        setBuxBalance(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch balance'
        }));
      }
    };

    fetchBuxBalance();
  }, [walletAddress]);

  const handleLogout = async () => {
    await disconnect();
    await signOut({ redirect: false });
  };

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
            {buxBalance.loading ? (
              'Loading BUX balance...'
            ) : buxBalance.error ? (
              <span className={styles.error}>{buxBalance.error}</span>
            ) : (
              `${buxBalance.balance.toLocaleString()} BUX`
            )}
          </p>
        </div>
      </div>
      <button 
        onClick={handleLogout}
        className={styles.logoutButton}
        title="Logout"
      >
        <FaSignOutAlt />
      </button>
    </div>
  );
} 