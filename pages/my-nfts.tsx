import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyNFTs.module.css';
import { FaImage } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

interface CollectionStats {
  name: string;
  count: number;
  floorPrice: number;
}

export default function MyNFTs() {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();

  // Mock floor prices - these would come from an API
  const floorPrices: { [key: string]: number } = {
    'Money Monsters': 25,
    'Money Monsters 3D': 35,
    'AI BitBots': 15,
    'Candy Bots': 12,
    'Energy Apes': 20,
    'Squirrels': 18,
    'CelebCatz': 30,
    'FCKED CATZ': 10,
    'RJCTD Bots': 8,
    'Doodle Bots': 14
  };

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your NFTs</h1>
        </div>
      </Layout>
    );
  }

  const collections = verifyResult?.collections?.map(collection => ({
    name: collection.name,
    count: collection.count,
    floorPrice: floorPrices[collection.name] || 0
  })) || [];

  const totalValue = collections.reduce((sum, collection) => 
    sum + (collection.count * collection.floorPrice), 0
  );

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaImage className={styles.titleIcon} />
          <h2 className={styles.title}>NFT Holdings</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Quantity</th>
                  <th>Floor Price</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(collection => (
                  <tr key={collection.name}>
                    <td>{collection.name}</td>
                    <td>{collection.count}</td>
                    <td>{collection.floorPrice} SOL</td>
                    <td>{(collection.count * collection.floorPrice).toFixed(2)} SOL</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan={3}>Total Portfolio Value</td>
                  <td>{totalValue.toFixed(2)} SOL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 