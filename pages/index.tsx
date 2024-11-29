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
      const { added, removed } = verifyResult.roleUpdate;
      if (added.length > 0 || removed.length > 0) {
        setRoleUpdate(verifyResult.roleUpdate);
        setShowRoleNotification(true);
      }
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

  const handleDiscordLogin = async () => {
    try {
      await signIn('discord', { 
        callbackUrl: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || '/',
      });
    } catch (error) {
      console.error('Discord login error:', error);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Image
              src="/logo.png"
              alt="BUX DAO Logo"
              width={128}
              height={128}
              priority
              className={styles.logoImage}
              onError={() => setImageError(true)}
            />
          </div>
          <h1 className={styles.title}>BUX DAO Role Verification</h1>
        </div>

        <div className={styles.loginContainer}>
          {!session ? (
            <button 
              onClick={handleDiscordLogin}
              className={styles.discordButton}
            >
              <FaDiscord className={styles.discordIcon} />
              Login with Discord
            </button>
          ) : !wallet.connected ? (
            <WalletMultiButton className={styles.connectButton}>
              Connect Wallet
            </WalletMultiButton>
          ) : (
            <UserProfile walletAddress={walletAddress} />
          )}
        </div>
        
        <RoleInfo />
      </main>
      {roleUpdate && showRoleNotification && (
        <RoleNotification 
          roleUpdate={roleUpdate}
          onClose={() => {
            setShowRoleNotification(false);
            setRoleUpdate(null);
          }}
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