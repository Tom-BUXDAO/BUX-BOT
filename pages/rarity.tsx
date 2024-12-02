import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import styles from '@/styles/Rarity.module.css';
import { FaStar } from 'react-icons/fa';

export default function RarityPage() {
  const { data: session } = useSession();
  const [collection, setCollection] = useState('');
  const [nftId, setNftId] = useState('');

  const collections = [
    'Money Monsters',
    'Money Monsters 3D',
    'Fcked Cats',
    'AI Bitbots',
    'Celeb Cats',
    'Energy Apes',
    'Candy Bots',
    'Rjctd Bots',
    'Doodle Bots',
    'AI Squirrels'
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <FaStar className={styles.icon} />
          <h2>Rarity Checker</h2>
        </div>

        <div className={styles.searchSection}>
          <select 
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className={styles.select}
            aria-label="Select Collection"
            title="Select Collection"
          >
            <option value="">Select Collection</option>
            {collections.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <input
            type="text"
            value={nftId}
            onChange={(e) => setNftId(e.target.value)}
            placeholder="Enter NFT ID"
            className={styles.input}
          />

          <button className={styles.checkButton}>
            Check Rarity
          </button>
        </div>

        <div className={styles.resultsSection}>
          {/* Rarity results will be displayed here */}
          <div className={styles.placeholder}>
            Select a collection and enter an NFT ID to check its rarity
          </div>
        </div>
      </div>
    </Layout>
  );
} 