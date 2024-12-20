import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/Profile.module.css';
import Image from 'next/image';
import { FaDiscord, FaWallet, FaUserCircle } from 'react-icons/fa';

export default function Profile() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your profile</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaUserCircle className={styles.titleIcon} />
          <h2 className={styles.title}>Profile Details</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.userInfo}>
            {session.user.image && (
              <Image
                src={session.user.image}
                alt="Profile"
                width={128}
                height={128}
                className={styles.avatar}
              />
            )}
            <h1>{session.user.name}</h1>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <FaDiscord className={styles.icon} />
              <div className={styles.statInfo}>
                <h3>Discord</h3>
                <p>{session.user.discordId}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <FaWallet className={styles.icon} />
              <div className={styles.statInfo}>
                <h3>Connected Wallets</h3>
                <div className={styles.walletList}>
                  {session.user.wallets?.map(wallet => (
                    wallet.address && (
                      <div key={wallet.address} className={styles.walletItem}>
                        {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 