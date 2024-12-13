import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import styles from '../styles/WalletConnect.module.css';
import RoleNotification from './RoleNotification';
import type { RoleUpdate } from '../types/verification';

export default function WalletConnect() {
  const wallet = useWallet();
  const { data: session } = useSession();
  const [verifying, setVerifying] = useState(false);
  const [roleUpdate, setRoleUpdate] = useState<RoleUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerification = async () => {
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Raw verification response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.changes) {
        setRoleUpdate(data.changes);
      } else {
        console.error('Missing changes in response:', data);
        throw new Error('No changes in response');
      }
      
    } catch (error: any) {
      console.error('Error updating roles:', error);
      setError(error.message || 'An error occurred during role update');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setRoleUpdate(null);
    setError(null);
  };

  if (!session) {
    return <div>Please sign in with Discord first</div>;
  }

  return (
    <div className={styles.container}>
      <WalletMultiButton />
      {wallet.publicKey && !roleUpdate && (
        <button 
          onClick={handleVerification}
          disabled={verifying}
          className={styles.verifyButton}
        >
          {verifying ? 'Updating Roles...' : 'Update Roles'}
        </button>
      )}
      {roleUpdate && (
        <RoleNotification 
          roleUpdate={roleUpdate} 
          onClose={handleClose}
        />
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
} 