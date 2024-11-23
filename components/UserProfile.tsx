import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../styles/UserProfile.module.css';
import { FaSignOutAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const BUX_TOKEN_ADDRESS = 'FMiRxSbLqRTWiBszt1DZmXd7SrscWCccY7fcXNtwWxHK';

interface CollectionCount {
  name: string;
  count: number;
}

interface HolderStatus {
  isHolder: boolean;
  collections: CollectionCount[];
}

interface UserProfileProps {
  holderStatus: HolderStatus | null;
}

export default function UserProfile({ holderStatus }: UserProfileProps) {
  const { data: session } = useSession();
  const { connected, publicKey, disconnect } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (connected && publicKey) {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`https://api.shyft.to/sol/v1/wallet/token_balance?network=mainnet-beta&wallet=${publicKey.toString()}&token=${BUX_TOKEN_ADDRESS}`, {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_SHYFT_API_KEY || '',
            },
          });

          const data = await response.json();
          
          if (data.success && data.result) {
            setBalance(parseFloat(data.result.balance));
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error('Error fetching token balance:', error);
          setError('Failed to fetch balance');
          setBalance(0);
        } finally {
          setLoading(false);
        }
      } else {
        setBalance(0);
      }
    };

    fetchTokenBalance();
  }, [connected, publicKey]);

  const handleLogout = async () => {
    if (connected) {
      await disconnect();
    }
    await signOut();
  };

  if (!session?.user) return null;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileInfo}>
        <div className={styles.balanceText}>
          {loading ? (
            'Loading...'
          ) : error ? (
            '0 $BUX'
          ) : (
            `${balance.toLocaleString()} $BUX`
          )}
        </div>
        <div className={styles.profileSection}>
          {session.user.image && (
            <div className={styles.profileImageWrapper}>
              <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className={styles.profileImage}
              />
              {holderStatus && (
                <div className={`${styles.holderBadge} ${holderStatus.isHolder ? styles.verified : styles.notVerified}`}>
                  {holderStatus.isHolder ? <FaCheckCircle /> : <FaTimesCircle />}
                </div>
              )}
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className={styles.logoutButton}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </div>
  );
} 