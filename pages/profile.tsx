import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/Profile.module.css';
import layoutStyles from '@/styles/Layout.module.css';
import { FaUser } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { prisma } from '@/lib/prisma';

interface UserData {
  discordName: string;
  email: string;
  wallets: { address: string; createdAt: Date }[];
  createdAt: Date;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.id) {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      }
    }
    fetchUserData();
  }, [session]);

  return (
    <Layout>
      <div className={styles.profileContainer}>
        <div className={layoutStyles.pageHeader}>
          <FaUser className={layoutStyles.pageIcon} />
          <h2>Profile</h2>
        </div>
        {userData && (
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <label>Username</label>
              <span>{userData.discordName}</span>
            </div>
            <div className={styles.infoRow}>
              <label>Email</label>
              <span>{userData.email}</span>
            </div>
            <div className={styles.infoRow}>
              <label>Member Since</label>
              <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
            </div>
            <div className={styles.walletsSection}>
              <h3>Connected Wallets</h3>
              <div className={styles.walletsList}>
                {userData.wallets.map(wallet => (
                  <div key={wallet.address} className={styles.walletItem}>
                    <span className={styles.walletAddress}>{wallet.address}</span>
                    <span className={styles.walletDate}>
                      Connected {new Date(wallet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 