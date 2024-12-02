import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyNFTs.module.css';
import { FaImage } from 'react-icons/fa';
import layoutStyles from '@/styles/Layout.module.css';

interface NFTCollection {
  name: string;
  count: number;
  floorPrice?: number;
}

export default function MyNFTsPage() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNFTs() {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}/nfts`);
          const data = await response.json();
          setCollections(data.collections);
        } catch (error) {
          console.error('Error fetching NFTs:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchNFTs();
  }, [session]);

  const totalValue = collections.reduce((sum, col) => 
    sum + (col.count * (col.floorPrice || 0)), 0
  );

  return (
    <Layout>
      <div className={styles.container}>
        <div className={layoutStyles.pageHeader}>
          <FaImage className={layoutStyles.pageIcon} />
          <h2>My NFTs</h2>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total NFTs</h3>
            <p>{collections.reduce((sum, col) => sum + col.count, 0)}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Value</h3>
            <p>{totalValue.toFixed(2)} SOL</p>
          </div>
        </div>

        <div className={styles.collectionSelect}>
          <select 
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            aria-label="Select NFT Collection"
            title="Select NFT Collection"
          >
            <option value="">All Collections</option>
            {collections.map(col => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.count})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.nftGrid}>
          {loading ? (
            <div className={styles.loading}>Loading NFTs...</div>
          ) : (
            // NFT grid will be populated here
            <div className={styles.placeholder}>
              Select a collection to view NFTs
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 