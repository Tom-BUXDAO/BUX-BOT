import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyNFTs.module.css';
import { FaImage } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import { useEffect, useState } from 'react';

interface CollectionStats {
  name: string;
  displayName: string;
  count: number;
  floorPrice: number;
  order: number;
}

// Define collection display names and order
const COLLECTION_CONFIG = {
  'Money Monsters': { displayName: 'Money Monsters', order: 1, symbol: 'monsters' },
  'FCKED CATZ': { displayName: 'Fcked Catz', order: 2, symbol: 'fckedcatz' },
  'AI BitBots': { displayName: 'AI BitBots', order: 3, symbol: 'aibitbots' },
  'Money Monsters 3D': { displayName: 'Money Monsters 3D', order: 4, symbol: 'monsters3d' },
  'CelebCatz': { displayName: 'Celeb Catz', order: 5, symbol: 'celebcatz' },
  'Warriors': { displayName: 'Warriors', order: 6, symbol: 'warriors' },
  'Squirrels': { displayName: 'Squirrels', order: 7, symbol: 'squirrels' },
  'Energy Apes': { displayName: 'Energy Apes', order: 8, symbol: 'energyapes' },
  'RJCTD Bots': { displayName: 'RJCTD Bots', order: 9, symbol: 'rjctdbots' },
  'Candy Bots': { displayName: 'Candy Bots', order: 10, symbol: 'candybots' },
  'Doodle Bots': { displayName: 'Doodle Bots', order: 11, symbol: 'doodlebots' }
};

export default function MyNFTs() {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();
  const [floorPrices, setFloorPrices] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const fetchFloorPrices = async () => {
      try {
        // Fetch floor prices for each collection from Magic Eden
        const prices: {[key: string]: number} = {};
        for (const [_, config] of Object.entries(COLLECTION_CONFIG)) {
          const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${config.symbol}/stats`);
          const data = await response.json();
          prices[config.symbol] = data.floorPrice / 1e9; // Convert from lamports to SOL
        }
        setFloorPrices(prices);
      } catch (error) {
        console.error('Error fetching floor prices:', error);
      }
    };

    fetchFloorPrices();
  }, []);

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your NFTs</h1>
        </div>
      </Layout>
    );
  }

  const collections = verifyResult?.collections
    ?.map(collection => ({
      name: collection.name,
      displayName: COLLECTION_CONFIG[collection.name]?.displayName || collection.name,
      count: collection.count,
      floorPrice: floorPrices[COLLECTION_CONFIG[collection.name]?.symbol] || 0,
      order: COLLECTION_CONFIG[collection.name]?.order || 999
    }))
    .sort((a, b) => a.order - b.order) || [];

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
                    <td>{collection.displayName}</td>
                    <td>{collection.count}</td>
                    <td>{collection.floorPrice.toFixed(2)} SOL</td>
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