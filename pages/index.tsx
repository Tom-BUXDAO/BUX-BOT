import React, { useState, useEffect, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { FaDiscord, FaWallet } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import UserProfile from '../components/UserProfile';
import RoleInfo from '../components/RoleInfo';
import RoleNotification from '../components/RoleNotification';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import layoutStyles from '@/styles/Layout.module.css';
import type { RoleUpdate } from '@/types/verification';

export default function Home() {
  const { data: session } = useSession();
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const { verifyResult, verifyWallet } = useWalletVerification();
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  const [roleUpdate, setRoleUpdate] = useState<RoleUpdate | null>(null);
  const [lastVerification, setLastVerification] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRoleUpdate = useCallback((update: RoleUpdate) => {
    // Always show notification with current roles
    setRoleUpdate(update);
    setShowRoleNotification(true);
  }, []);

  useEffect(() => {
    if (verifyResult?.roleUpdate) {
      const verificationKey = JSON.stringify(verifyResult.roleUpdate);
      if (verificationKey !== lastVerification) {
        console.log('New role update:', verifyResult.roleUpdate);
        handleRoleUpdate(verifyResult.roleUpdate);
        setLastVerification(verificationKey);

        const timer = setTimeout(() => {
          setShowRoleNotification(false);
          setRoleUpdate(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [verifyResult, lastVerification, handleRoleUpdate]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toString());
    }
  }, [wallet.connected, wallet.publicKey]);

  const handleNotificationClose = useCallback(() => {
    console.log('Closing notification');
    setShowRoleNotification(false);
    setRoleUpdate(null);
  }, []);

  const handleVerifyWallet = useCallback(async () => {
    if (!walletAddress) return;
    setIsVerifying(true);
    try {
      await verifyWallet(walletAddress);
    } finally {
      setIsVerifying(false);
    }
  }, [walletAddress, verifyWallet]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <Image
            src="/logo.png"
            alt="BUX DAO Logo"
            width={96}
            height={96}
            priority
            className={styles.logo}
          />
          <h1 className={styles.title}>BUX&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DAO</h1>
        </div>
        <div className={layoutStyles.pageHeader}>
          <FaWallet className={layoutStyles.pageIcon} />
          <h2>Holder Verify</h2>
        </div>

        {!session ? (
          <button 
            onClick={() => signIn('discord')}
            className={styles.walletButton}
          >
            <FaDiscord />
            Login with Discord
          </button>
        ) : (
          <>
            <WalletMultiButton 
              className={styles.walletButton} 
              disabled={isVerifying}
            />
            {isVerifying && (
              <div className={styles.verifying}>
                <div className={styles.spinner} />
                <span>Verifying...</span>
              </div>
            )}
            <UserProfile walletAddress={walletAddress} />
          </>
        )}
        
        <RoleInfo />
      </main>
      
      {roleUpdate && showRoleNotification && (
        <div className={styles.overlay}>
          <RoleNotification 
            roleUpdate={roleUpdate}
            onClose={handleNotificationClose}
          />
        </div>
      )}
    </div>
  );
} 