import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaSignOutAlt, FaBars, FaWallet, FaCoins, FaPaintBrush, FaUser, FaImage, FaCrown, FaCheck, FaTimes } from 'react-icons/fa';
import styles from '@/styles/UserProfile.module.css';
import Image from 'next/image';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

interface UserProfileProps {
  walletAddress: string;
}

export default function UserProfile({ walletAddress }: UserProfileProps) {
  const { data: session } = useSession();
  const { disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const wallet = useWallet();
  const { verifyResult, verifyWallet: contextVerifyWallet } = useWalletVerification();

  const menuItems = [
    {
      label: 'Verify Holder',
      icon: <FaWallet className={styles.menuIcon} />
    },
    {
      label: 'Profile',
      icon: <FaUser className={styles.menuIcon} />
    },
    {
      label: 'My NFTs',
      icon: <FaImage className={styles.menuIcon} />
    },
    {
      label: 'My Roles',
      icon: <FaCrown className={styles.menuIcon} />
    },
    {
      label: 'BUX',
      icon: <FaCoins className={styles.menuIcon} />
    },
    {
      label: 'Rarity',
      icon: <FaPaintBrush className={styles.menuIcon} />
    }
  ];

  useEffect(() => {
    if (session && walletAddress) {
      contextVerifyWallet(walletAddress);
    }
  }, [contextVerifyWallet, session, walletAddress]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {session?.user?.image && (
          <div className={styles.avatarContainer}>
            <Image
              src={session.user.image}
              alt="Profile"
              width={48}
              height={48}
              className={styles.avatar}
            />
            <div className={`${styles.verificationBadge} ${verifyResult?.isHolder ? styles.verified : styles.unverified}`}>
              {verifyResult?.isHolder ? <FaCheck /> : <FaTimes />}
            </div>
          </div>
        )}
        <div className={styles.info}>
          <div className={styles.name}>{session?.user?.name}</div>
          <div className={styles.balance}>{verifyResult?.buxBalance?.toLocaleString()} BUX</div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={styles.menuButton}
          title="Toggle menu"
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>
        <button
          onClick={async () => {
            if (wallet.connected) await disconnect();
            await signOut();
          }}
          className={styles.signOutButton}
          title="Sign out"
          aria-label="Sign out"
        >
          <FaSignOutAlt />
        </button>
      </div>
      {showMenu && (
        <div className={styles.menu}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.label === 'Verify Holder') {
                  contextVerifyWallet(walletAddress);
                }
                setShowMenu(false);
              }}
              className={styles.menuItem}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 