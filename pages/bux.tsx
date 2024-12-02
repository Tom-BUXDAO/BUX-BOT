import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import styles from '@/styles/BUX.module.css';
import { FaCoins } from 'react-icons/fa';

interface BUXData {
  totalSupply: number;
  liquidityValue: number;
  price: number;
  userBalance: number;
}

export default function BUXPage() {
  const { data: session } = useSession();
  const [buxData, setBuxData] = useState<BUXData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBUXData() {
      try {
        const response = await fetch('/api/bux/stats');
        const data = await response.json();
        setBuxData(data);
      } catch (error) {
        console.error('Error fetching BUX data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBUXData();
  }, []);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <FaCoins className={styles.icon} />
          <h2>BUX Token</h2>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading BUX data...</div>
        ) : buxData && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Your Balance</h3>
              <p>{buxData.userBalance.toLocaleString()} BUX</p>
              <span className={styles.usdValue}>
                ≈ ${(buxData.userBalance * buxData.price).toFixed(2)}
              </span>
            </div>

            <div className={styles.statCard}>
              <h3>Total Supply</h3>
              <p>{buxData.totalSupply.toLocaleString()} BUX</p>
            </div>

            <div className={styles.statCard}>
              <h3>Liquidity Value</h3>
              <p>{buxData.liquidityValue.toFixed(2)} SOL</p>
            </div>

            <div className={styles.statCard}>
              <h3>Price</h3>
              <p>${buxData.price.toFixed(4)}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 