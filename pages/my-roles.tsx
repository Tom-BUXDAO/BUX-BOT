import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

// Filter out any roles that start with '@' or are system roles
const formatRoleName = (role: string) => {
  if (role.startsWith('@')) return null;
  // Convert role ID to readable name if needed
  switch (role) {
    case '1093607187454111825': return 'BUX Holder';
    case '1093606579355525252': return 'NFT Holder';
    case '1095034117877399686': return 'Money Monsters';
    case '1095033899492573274': return 'Candy Bots';
    case '1095033759612547133': return 'Energy Apes';
    case '1095033566070583457': return 'AI BitBots';
    case '1093607056696692828': return 'Squirrels';
    case '1093606438674382858': return 'CelebCatz';
    case '1095335098112561234': return 'FCKED CATZ';
    case '1300969268665389157': return 'RJCTD Bots';
    case '1300969353952362557': return 'Doodle Bots';
    case '1300968964276621313': return 'Money Monsters 3D';
    default: return role;
  }
};

export default function MyRoles() {
  const { data: session } = useSession();
  const { verifyResult } = useWalletVerification();

  if (!session?.user) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Please sign in to view your roles</h1>
        </div>
      </Layout>
    );
  }

  const roles = verifyResult?.assignedRoles
    ?.map(formatRoleName)
    .filter((role): role is string => role !== null);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaCrown className={styles.titleIcon} />
          <h2 className={styles.title}>Server Roles</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.roleList}>
            {roles?.map((role, index) => (
              <div key={index} className={styles.roleItem}>
                {role}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 