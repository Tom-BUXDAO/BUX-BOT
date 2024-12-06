import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyNFTs.module.css';
import { FaImage } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';

interface CollectionData {
  name: string;
  count: number;
  floorPrice: bigint;
  listedCount: number;
}

interface MyNFTsProps {
  collections: CollectionData[];
}

export default function MyNFTs({ collections }: MyNFTsProps) {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your NFTs</h1>
        </div>
      </Layout>
    );
  }

  const totalValue = collections.reduce((sum, collection) => 
    sum + (collection.count * Number(collection.floorPrice)), 0
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
                    <td>{Number(collection.floorPrice) / 1e9} SOL</td>
                    <td>{(collection.count * Number(collection.floorPrice) / 1e9).toFixed(2)} SOL</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan={3}>Total Portfolio Value</td>
                  <td>{(totalValue / 1e9).toFixed(2)} SOL</td>
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
      listedCount: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Convert BigInt to string for JSON serialization
  const serializedCollections = collections.map(c => ({
    ...c,
    floorPrice: c.floorPrice.toString(),
    count: 0 // This will be updated from verifyResult on client side
  }));

  return {
    props: {
      collections: serializedCollections
    }
  };
}; 