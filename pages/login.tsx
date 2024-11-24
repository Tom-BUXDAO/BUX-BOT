import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';
import { FaDiscord } from 'react-icons/fa';
import Image from 'next/image';

export default function Login() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  if (session) {
    router.push('/');
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <Image 
            src="/bux-logo.png"
            alt="BUX DAO Logo"
            width={150}
            height={150}
            priority
          />
        </div>
        <h1>BUX DAO NFT Verification</h1>
        <p>Connect with Discord to verify your NFT holdings</p>
        <button 
          className={styles.discordButton}
          onClick={() => signIn('discord', { callbackUrl: '/' })}
        >
          <FaDiscord className={styles.discordIcon} />
          Login with Discord
        </button>
      </div>
    </div>
  );
} 