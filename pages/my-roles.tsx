import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

// Map role IDs to their display names
const ROLE_NAMES: { [key: string]: string } = {
  '1093607056696692828': 'Squirrels',
  '1093606438674382858': 'CelebCatz',
  '1095033759612547133': 'Energy Apes',
  '1095034117877399686': 'Money Monsters',
  '1095033899492573274': 'Candy Bots',
  '1093607187454111825': 'BUX Holder',
  '1093606579355525252': 'NFT Holder',
  '1095335098112561234': 'FCKED CATZ',
  '1300968964276621313': 'Money Monsters 3D',
  '1300969268665389157': 'RJCTD Bots',
  '1300969353952362557': 'Doodle Bots'
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

  const roles = verifyResult?.assignedRoles?.map(roleId => ({
    id: roleId,
    name: ROLE_NAMES[roleId] || roleId
  }));

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaCrown className={styles.titleIcon} />
          <h2 className={styles.title}>Server Roles</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.roleList}>
            {roles?.map(role => (
              <div key={role.id} className={styles.roleItem}>
                {role.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 