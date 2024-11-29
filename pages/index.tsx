import React, { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord, FaWallet } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletError, Adapter, WalletName } from '@solana/wallet-adapter-base';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import UserProfile from '../components/UserProfile';
import RoleInfo from '../components/RoleInfo';
import RoleNotification from '../components/RoleNotification';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

export default function Home() {
  const { data: session } = useSession();
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [walletStatus, setWalletStatus] = useState('');
  const { verifyResult, loading, error, verifyWallet } = useWalletVerification();
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [roleUpdate, setRoleUpdate] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toString());
    } else {
      setWalletAddress('');
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (wallet.connecting) {
      setWalletStatus('Connecting...');
    } else if (wallet.connected && wallet.publicKey) {
      verifyWallet(wallet.publicKey.toString());
      setWalletStatus('Verifying...');
    } else {
      setWalletStatus('');
    }
  }, [wallet.connecting, wallet.connected, wallet.publicKey, verifyWallet]);

  useEffect(() => {
    if (verifyResult?.roleUpdate) {
      setRoleUpdate(verifyResult.roleUpdate);
      setShowRoleNotification(true);
    }
  }, [verifyResult]);

  const handleConnect = async () => {
    try {
      setWalletError(null);
      setWalletStatus('Connecting...');

      const modalButton = document.querySelector('.wallet-adapter-button-trigger');
      if (modalButton instanceof HTMLElement) {
        modalButton.click();
      } else {
        throw new Error('Wallet connection failed');
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

  useEffect(() => {
    if (wallet.connected) {
      setWalletStatus('Connected');
      setWalletError(null);
    }
  }, [wallet.connected]);

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
            <WalletMultiButton className={styles.walletButton}>
              Connect Wallet
            </WalletMultiButton>
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
      {roleUpdate && showRoleNotification && (
        <RoleNotification 
          roleUpdate={roleUpdate}
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