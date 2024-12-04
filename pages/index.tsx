import React, { useState, useEffect } from 'react';
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

export default function Home() {
  const { data: session } = useSession();
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const { verifyResult } = useWalletVerification();
  const [showRoleNotification, setShowRoleNotification] = useState(false);
  const [roleUpdate, setRoleUpdate] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    if (verifyResult?.roleUpdate) {
      console.log('Role update received:', verifyResult.roleUpdate);
      const { added, removed } = verifyResult.roleUpdate;
      
      setRoleUpdate(verifyResult.roleUpdate);
      setShowRoleNotification(true);
      
      console.log('Setting notification state:', {
        roleUpdate: verifyResult.roleUpdate,
        showNotification: true
      });
    }
  }, [verifyResult]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toString());
    }
  }, [wallet.connected, wallet.publicKey]);

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
            <WalletMultiButton className={styles.walletButton} />
            <UserProfile walletAddress={walletAddress} />
          </>
        )}
        
        <RoleInfo />
      </main>
      
      {roleUpdate && showRoleNotification && (
        <div className={styles.overlay}>
          <RoleNotification 
            roleUpdate={roleUpdate}
            onClose={() => {
              setShowRoleNotification(false);
              setRoleUpdate(null);
            }}
          />
        </div>
      )}
    </div>
  );
} 