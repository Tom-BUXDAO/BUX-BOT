import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
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
  const { verifyResult } = useWalletVerification();
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

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <Image
            src="/logo.png"
            alt="BUX DAO Logo"
            width={128}
            height={128}
            priority
            className={styles.logo}
          />
          <div className={styles.logoText}>BUX DAO</div>
        </div>

        {!session ? (
          <button 
            onClick={() => signIn('discord')}
            className={styles.connectButton}
            style={{ background: '#5865F2' }}
          >
            <FaDiscord className={styles.icon} />
            Login with Discord
          </button>
        ) : !wallet.connected ? (
          <WalletMultiButton className={styles.connectButton} />
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