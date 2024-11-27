import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from '@/styles/UserProfile.module.css';
import RoleNotification from './RoleNotification';

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

export default function UserProfile({ walletAddress }: { walletAddress: string }) {
  const { data: session } = useSession();
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoles, setShowRoles] = useState(true);

  useEffect(() => {
    async function verifyWallet() {
      if (!walletAddress || !session?.user?.discordId) return;
      
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
            discordId: session.user.discordId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify wallet');
        }

        const result = await response.json();
        console.log('Verify result:', result);
        setVerifyResult(result);
        setShowRoles(true);
      } catch (err) {
        console.error('Error verifying wallet:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify wallet');
      } finally {
        setLoading(false);
      }
    }

    verifyWallet();
  }, [walletAddress, session?.user?.discordId]);

  const handleCloseRoles = () => {
    setShowRoles(false);
  };

  if (!session?.user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <img
          src={session.user.image || '/default-avatar.png'}
          alt={session.user.name || 'User'}
          className={styles.avatar}
        />
        <div className={styles.details}>
          <div className={styles.name}>{session.user.name}</div>
          <div className={styles.balance}>
            {verifyResult ? `${verifyResult.buxBalance.toLocaleString()} BUX` : 'Loading...'}
          </div>
        </div>
      </div>
      {verifyResult?.assignedRoles && showRoles && (
        <RoleNotification 
          roles={verifyResult.assignedRoles} 
          onClose={handleCloseRoles}
        />
      )}
    </div>
  );
} 