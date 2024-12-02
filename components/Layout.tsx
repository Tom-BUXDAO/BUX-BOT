import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import UserProfile from './UserProfile';
import styles from '@/styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const wallet = useWallet();
  const router = useRouter();
  const walletAddress = wallet.publicKey?.toString() || '';

  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  if (!session) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Image
          src="/logo.png"
          alt="BUX DAO Logo"
          width={96}
          height={96}
          priority
          className={styles.logo}
        />
        <h1 className={styles.title}>BUX&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DAO</h1>
        <UserProfile walletAddress={walletAddress} />
      </div>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
} 