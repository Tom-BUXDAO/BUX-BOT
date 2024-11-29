import React, { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
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
  const { verifyResult, loading, error, verifyWallet } = useWalletVerification();
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  const [roleUpdate, setRoleUpdate] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toString());
    } else {
      setWalletAddress('');
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (verifyResult?.roleUpdate) {
      const { added, removed } = verifyResult.roleUpdate;
      if (added.length > 0 || removed.length > 0) {
        setRoleUpdate(verifyResult.roleUpdate);
        setShowRoleNotification(true);
      }
    }
  }, [verifyResult]);

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
        {!session ? (
          <button 
            onClick={handleDiscordLogin}
            className={styles.loginButton}
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