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

  const [lastVerified, setLastVerified] = useState<number>(0);
  const VERIFY_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    async function verifyWallet() {
      if (!walletAddress || !session?.user?.id) return;
      
      const now = Date.now();
      if (now - lastVerified < VERIFY_INTERVAL) return;
      
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

        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Please log in again' : 'Failed to verify wallet');
        }

        const result = await response.json();
        setVerifyResult(result);
        setLastVerified(now);
      } catch (err) {
        console.error('Error verifying wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify wallet');
      } finally {
        setLoading(false);
      }
    }

    verifyWallet();
  }, [walletAddress, session?.user?.id, lastVerified]);

  useEffect(() => {
    if (verifyResult) {
      setBuxBalance({
        balance: verifyResult.buxBalance,
        loading: false,
        error: null
      });
    }
  }, [verifyResult]);

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
            {loading ? (
              'Verifying...'
            ) : error ? (
              <span className={styles.error}>{error}</span>
            ) : (
              `${verifyResult?.buxBalance.toLocaleString() ?? 0} BUX`
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