import { useSession } from 'next-auth/react';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import Layout from '@/components/Layout';
import styles from '@/styles/Profile.module.css';
import Image from 'next/image';
import { FaDiscord, FaWallet, FaCoins, FaImage } from 'react-icons/fa';
import { CollectionInfo } from '@/types/verification';

export default function Profile() {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();

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
        <div className={styles.header}>
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
              <p>{session.user.wallets?.length || 0} wallets</p>
              <div className={styles.walletList}>
                {session.user.wallets?.map(wallet => (
                  <div key={wallet.address} className={styles.walletItem}>
                    {wallet.address ? (
                      <>
                        {wallet.address.slice(0, 4)}...
                        {wallet.address.slice(-4)}
                      </>
                    ) : (
                      'No wallet connected'
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <FaCoins className={styles.icon} />
            <div className={styles.statInfo}>
              <h3>BUX Balance</h3>
              <p>{verifyResult?.buxBalance?.toLocaleString() || 0} BUX</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <FaImage className={styles.icon} />
            <div className={styles.statInfo}>
              <h3>NFTs Owned</h3>
              <p>{verifyResult?.totalNFTs || 0} NFTs</p>
            </div>
          </div>
        </div>

        <div className={styles.collections}>
          <h2>Collections</h2>
          <div className={styles.collectionList}>
            {verifyResult?.collections?.map((collection: CollectionInfo) => (
              <div key={collection.name} className={styles.collectionItem}>
                {collection.name}
                {collection.count > 1 && (
                  <span className={styles.collectionCount}>
                    ({collection.count})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 