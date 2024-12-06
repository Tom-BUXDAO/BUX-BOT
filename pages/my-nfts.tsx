import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyNFTs.module.css';
import { FaImage } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { Collections } from '@/types/verification';

interface CollectionData {
  name: string;
  displayName: string;
  count: number;
  floorPrice: bigint;
  listedCount: number;
  isMain: boolean;
}

interface MyNFTsProps {
  collections: CollectionData[];
}

const DISPLAY_NAMES: Record<string, string> = {
  'money_monsters': 'Money Monsters',
  'money_monsters3d': 'Money Monsters 3D',
  'celebcatz': 'Celeb Catz',
  'fcked_catz': 'Fcked Catz',
  'ai_bitbots': 'AI BitBots',
  'warriors': 'Warriors',
  'squirrels': 'Squirrels',
  'energy_apes': 'Energy Apes',
  'rjctd_bots': 'RJCTD Bots',
  'candy_bots': 'Candy Bots',
  'doodle_bot': 'Doodle Bots',
  'MM_top10': 'MM Top 10',
  'MM3D_top10': 'MM3D Top 10'
} as const;

export default function MyNFTs({ collections }: MyNFTsProps) {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();
  const [updatedCollections, setUpdatedCollections] = useState(collections);
  const [solPrice, setSolPrice] = useState<number>(0);

  // Fetch SOL price
  useEffect(() => {
    async function fetchSolPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolPrice(data.solana.usd);
      } catch (error) {
        console.error('Error fetching SOL price:', error);
      }
    }
    fetchSolPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchSolPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (verifyResult?.collections) {
      const dbToDisplayMap: Record<string, string> = {
        'money_monsters': 'Money Monsters',
        'money_monsters3d': 'Money Monsters 3D',
        'celebcatz': 'CelebCatz',
        'fcked_catz': 'FCKED CATZ',
        'ai_bitbots': 'AI BitBots',
        'warriors': 'Warriors',
        'squirrels': 'Squirrels',
        'energy_apes': 'Energy Apes',
        'rjctd_bots': 'RJCTD Bots',
        'candy_bots': 'Candy Bots',
        'doodle_bot': 'Doodle Bots'
      };

      const newCollections = collections.map(collection => ({
        ...collection,
        count: verifyResult.collections[dbToDisplayMap[collection.name]]?.count ?? 0
      }));
      
      console.log('Updating collections with counts:', newCollections);
      setUpdatedCollections(newCollections);
    }
  }, [verifyResult, collections]);

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your NFTs</h1>
        </div>
      </Layout>
    );
  }

  const totalValue = updatedCollections.reduce((sum, collection) => 
    sum + (collection.count * Number(collection.floorPrice)), 0
  );

  const totalNFTs = updatedCollections.reduce((sum, collection) => 
    sum + collection.count, 0
  );

  const totalUsdValue = (totalValue / 1e9) * solPrice;

  // Sort collections: main collections first, then alphabetically
  const sortedCollections = [...updatedCollections].sort((a, b) => {
    if (a.isMain !== b.isMain) return b.isMain ? 1 : -1;
    return a.displayName.localeCompare(b.displayName);
  });

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
                  <th>USD Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedCollections.map(collection => {
                  const solValue = collection.count * Number(collection.floorPrice) / 1e9;
                  const usdValue = solValue * solPrice;
                  return (
                    <tr key={collection.name}>
                      <td>{collection.displayName}</td>
                      <td>{collection.count}</td>
                      <td>{Number(collection.floorPrice) / 1e9} SOL</td>
                      <td>{solValue.toFixed(2)} SOL</td>
                      <td>${usdValue.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className={styles.totalRow}>
                  <td colSpan={3}>Total Portfolio Value ({totalNFTs} NFTs)</td>
                  <td>{(totalValue / 1e9).toFixed(2)} SOL</td>
                  <td>${totalUsdValue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const collections = await prisma.collection.findMany({
    select: {
      name: true,
      floorPrice: true,
      listedCount: true,
      isMain: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Convert BigInt to string for JSON serialization and add display names
  const serializedCollections = collections.map(c => ({
    ...c,
    displayName: DISPLAY_NAMES[c.name] || c.name,
    floorPrice: c.floorPrice.toString(),
    count: 0 // This will be updated from verifyResult on client side
  }));

  return {
    props: {
      collections: serializedCollections
    }
  };
}; 