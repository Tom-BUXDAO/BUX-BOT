import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/TopHolders.module.css';

interface TopHolder {
  discordId?: string;
  address?: string;
  name: string;
  image: string | null;
  totalValue: number;
  totalNFTs: number;
  collections: Record<string, number>;
}

export default function TopHolders() {
  const [holders, setHolders] = useState<TopHolder[]>([]);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [holdersRes, priceRes] = await Promise.all([
          fetch('/api/get-top-holders'),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        ]);
        
        if (!holdersRes.ok) {
          throw new Error('Failed to fetch holders data');
        }
        
        const holdersData = await holdersRes.json();
        const priceData = await priceRes.json();
        
        if (Array.isArray(holdersData)) {
          setHolders(holdersData);
          setError('');
        } else {
          setError('Invalid data format received');
        }
        
        setSolPrice(priceData.solana.usd);
      } catch (error) {
        console.error('Error fetching top holders:', error);
        setError('Failed to load top holders');
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Top Holders</h2>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Top Holders</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Total NFTs</th>
              <th>Portfolio Value</th>
              <th>USD Value</th>
            </tr>
          </thead>
          <tbody>
            {holders.map((holder, index) => (
              <tr key={holder.discordId || holder.address}>
                <td>{index + 1}</td>
                <td className={styles.userCell}>
                  {holder.image && (
                    <Image
                      src={holder.image}
                      alt={holder.name}
                      width={24}
                      height={24}
                      className={styles.avatar}
                    />
                  )}
                  <span>{holder.name}</span>
                </td>
                <td>{holder.totalNFTs}</td>
                <td><span className={styles.solValue}>{holder.totalValue.toFixed(2)} ◎</span></td>
                <td>${(holder.totalValue * solPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 