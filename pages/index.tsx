import React, { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord, FaWallet } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletError, Adapter } from '@solana/wallet-adapter-base';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import UserProfile from '../components/UserProfile';
import RoleInfo from '../components/RoleInfo';
import RoleNotification from '../components/RoleNotification';

export default function Home() {
  const { data: session } = useSession();
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [walletStatus, setWalletStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isHolder: boolean;
    collections: Array<{ name: string; count: number }>;
    assignedRoles?: string[];
  } | null>(null);
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toString());
    } else {
      setWalletAddress('');
    }
  }, [wallet.publicKey]);

  const updateWallet = useCallback(async (address: string) => {
    if (isUpdating || !session) return;

    setIsUpdating(true);
    setWalletStatus('Updating wallet...');
    
    try {
      const response = await fetch('/api/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: address,
          discordId: session?.user?.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update wallet');
      }

      const data = await response.json();
      setVerifyResult(data);
      setWalletStatus('Wallet Connected');
      
      if (data.assignedRoles?.length > 0) {
        setShowRoleNotification(true);
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      setWalletStatus('Error connecting wallet');
      setVerifyResult(null);
    } finally {
      setIsUpdating(false);
    }
  }, [session, isUpdating]);

  useEffect(() => {
    if (wallet.connecting) {
      setWalletStatus('Connecting...');
    } else if (wallet.connected && wallet.publicKey) {
      updateWallet(wallet.publicKey.toString());
    } else {
      setWalletStatus('');
    }
  }, [wallet, updateWallet]);

  const handleConnect = async () => {
    try {
      setWalletError(null);
      setWalletStatus('Connecting...');

      if (!window.solana) {
        throw new Error('Please install a Solana wallet extension');
      }

      if (!wallet.connected) {
        const modalButton = document.querySelector('.wallet-adapter-modal-trigger');
        if (modalButton instanceof HTMLElement) {
          modalButton.click();
        } else {
          await wallet.select('Phantom');
          await wallet.connect().catch((err) => {
            throw new Error(err.message || 'Failed to connect wallet');
          });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletError(error instanceof Error ? error.message : 'Failed to connect wallet');
      setWalletStatus('Error connecting wallet');
    }
  };

  useEffect(() => {
    const onError = (error: WalletError) => {
      console.error('Wallet error:', error);
      setWalletError(error.message);
      setWalletStatus('Error: ' + error.message);
    };

    if (wallet.wallet?.adapter) {
      const adapter = wallet.wallet.adapter as Adapter;
      adapter.on('error', onError);
      
      return () => {
        adapter.off('error', onError);
      };
    }
  }, [wallet.wallet]);

  return (
    <div className={styles.container}>
      {session && <UserProfile walletAddress={walletAddress} />}
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
              Log in
            </button>
          ) : !wallet.connected ? (
            <button
              className={styles.connectButton}
              onClick={handleConnect}
              disabled={wallet.connecting}
            >
              <FaWallet className={styles.walletIcon} />
              {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className={styles.walletButtonWrapper}>
              <WalletMultiButton className={styles.walletButton} />
              {walletStatus && (
                <p className={`${styles.walletStatus} ${wallet.connected ? styles.connected : ''} ${walletError ? styles.error : ''}`}>
                  {walletError || walletStatus}
                </p>
              )}
              {verifyResult && (
                <div className={styles.holderStatus}>
                  <p className={`${styles.holderText} ${verifyResult.isHolder ? styles.verified : styles.notVerified}`}>
                    {verifyResult.isHolder ? '✓ Verified Holder' : '✗ Not a Holder'}
                  </p>
                  {verifyResult.isHolder && verifyResult.collections.length > 0 && (
                    <div className={styles.collections}>
                      <p>Collections:</p>
                      <ul>
                        {verifyResult.collections.map((collection) => (
                          <li key={collection.name}>{collection.count} x {collection.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
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

declare global {
  interface Window {
    solana?: any;
  }
} 