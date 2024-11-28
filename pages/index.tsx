import React, { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import UserProfile from '../components/UserProfile';
import RoleInfo from '../components/RoleInfo';
import RoleNotification from '../components/RoleNotification';

interface CollectionCount {
  name: string;
  count: number;
}

interface WalletUpdateResponse {
  isHolder: boolean;
  collections: CollectionCount[];
  walletAddress: string;
  assignedRoles?: string[];
}

interface VerifyResult {
  isHolder: boolean;
  collections: CollectionCount[];
  assignedRoles?: string[];
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const { connected, connecting, disconnect } = useWallet();
  const [walletStatus, setWalletStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdatedWallet, setLastUpdatedWallet] = useState<string | null>(null);
  const [holderStatus, setHolderStatus] = useState<{
    isHolder: boolean;
    collections: CollectionCount[];
  } | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [showRoleNotification, setShowRoleNotification] = useState(false);

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress('');
    }
  }, [publicKey]);

  const updateWallet = useCallback(async (address: string) => {
    if (isUpdating || !session || address === lastUpdatedWallet) return;

    setIsUpdating(true);
    setWalletStatus('Updating wallet...');
    
    try {
      const response = await fetch('/api/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();
      console.log('Verify result:', data);

      if (!response.ok) {
        throw new Error('Failed to update wallet address');
      }

      setWalletStatus('Wallet Connected');
      setLastUpdatedWallet(address);
      setVerifyResult(data);
      
      if (data.assignedRoles?.length > 0) {
        setShowRoleNotification(true);
      }
    } catch (error) {
      console.error('Error updating wallet address:', error);
      setWalletStatus('Error connecting wallet');
      setVerifyResult(null);
    } finally {
      setIsUpdating(false);
    }
  }, [session, isUpdating, lastUpdatedWallet]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (connected) {
        disconnect();
      }
      if (session) {
        signOut({ redirect: false });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [connected, disconnect, session]);

  useEffect(() => {
    if (connecting) {
      setWalletStatus('Connecting...');
    } else if (connected && publicKey) {
      updateWallet(publicKey.toString());
    } else {
      setWalletStatus('');
    }
  }, [connected, connecting, publicKey, updateWallet]);

  return (
    <div className={styles.container}>
      <UserProfile walletAddress={walletAddress} />
      <main className={styles.main}>
        <div className={styles.logoContainer}>
          {!imageError ? (
            <Image 
              src="/logo.png"
              alt="BUX DAO Logo"
              width={100}
              height={100}
              className={styles.logoImage}
              onError={() => setImageError(true)}
              priority
            />
          ) : (
            <div className={styles.logoPlaceholder} />
          )}
          <div className={styles.logoText}>BUX&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DAO</div>
        </div>
        
        <h1 className={styles.title}>
          Holder Verification
        </h1>

        <div className={styles.loginContainer}>
          {!session ? (
            <button
              className={styles.discordButton}
              onClick={() => signIn('discord')}
            >
              <FaDiscord className={styles.discordIcon} />
              Sign in
            </button>
          ) : !connected ? (
            <button
              className={styles.connectButton}
              onClick={() => signIn('discord')}
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <p className={styles.loggedInText}>Signed in as {session.user?.name}</p>
              <div className={styles.walletButtonWrapper}>
                <WalletMultiButton className={styles.walletButton} />
                {walletStatus && (
                  <p className={`${styles.walletStatus} ${connected ? styles.connected : ''} ${walletStatus.includes('Error') ? styles.error : ''}`}>
                    {walletStatus}
                  </p>
                )}
                {holderStatus && (
                  <div className={styles.holderStatus}>
                    <p className={`${styles.holderText} ${holderStatus.isHolder ? styles.verified : styles.notVerified}`}>
                      {holderStatus.isHolder ? '✓ Verified Holder' : '✗ Not a Holder'}
                    </p>
                    {holderStatus.isHolder && holderStatus.collections.length > 0 && (
                      <div className={styles.collections}>
                        <p>Collections:</p>
                        <ul>
                          {holderStatus.collections.map((collection) => (
                            <li key={collection.name}>{collection.count} x {collection.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <RoleInfo />
      </main>
      {verifyResult?.assignedRoles && showRoleNotification && (
        <RoleNotification 
          roles={verifyResult.assignedRoles}
          onClose={() => setShowRoleNotification(false)}
        />
      )}
    </div>
  );
} 