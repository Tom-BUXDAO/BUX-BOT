import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/TopHolders.module.css';

interface TopHolder {
  discordId: string;
  name: string;
  image: string;
  totalValue: number;
  totalNFTs: number;
  collections: Record<string, number>;
}

export default function TopHolders() {
  const [holders, setHolders] = useState<TopHolder[]>([]);
  const [solPrice, setSolPrice] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [holdersRes, priceRes] = await Promise.all([
          fetch('/api/get-top-holders'),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        ]);
        
        const holdersData = await holdersRes.json();
        const priceData = await priceRes.json();
        
        setHolders(holdersData);
        setSolPrice(priceData.solana.usd);
      } catch (error) {
        console.error('Error fetching top holders:', error);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
              <tr key={holder.discordId}>
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