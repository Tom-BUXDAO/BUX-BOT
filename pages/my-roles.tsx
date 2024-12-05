import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

// Match exact role mapping from RoleNotification
const ROLE_MAP = {
  '1093607056696692828': 'Squirrels',
  '1093606438674382858': 'CelebCatz',
  '1095033759612547133': 'Energy Apes',
  '1095034117877399686': 'Money Monsters',
  '1095033899492573274': 'Candy Bots',
  '1093607187454111825': 'BUX Holder',
  '1093606579355525252': 'NFT Holder',
  '1095335098112561234': 'FCKED CATZ',
  '1300968613179686943': '1300968613179686943',  // Keep unmapped IDs as is
  '1300968964276621313': 'Money Monsters 3D',
  '1300969147441610773': '1300969147441610773',  // Keep unmapped IDs as is
  '1300969268665389157': 'RJCTD Bots',
  '1300969353952362557': 'Doodle Bots',
  '1248428373487784006': '1248428373487784006',  // Keep unmapped IDs as is
  '1095363984581984357': '1095363984581984357'   // Keep unmapped IDs as is
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

  // Map roles in exact order
  const roles = verifyResult?.assignedRoles?.map(roleId => ({
    id: roleId,
    name: ROLE_MAP[roleId as keyof typeof ROLE_MAP] || roleId
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