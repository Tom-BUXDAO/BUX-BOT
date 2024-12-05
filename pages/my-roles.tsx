import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

const ROLE_ORDER = [
  { id: '1093607187454111825', name: 'BUX Holder' },
  { id: '1093606579355525252', name: 'NFT Holder' },
  { id: '1093606438674382858', name: 'CelebCatz' },
  { id: '1093607056696692828', name: 'Squirrels' },
  { id: '1095033759612547133', name: 'Energy Apes' },
  { id: '1095034117877399686', name: 'Money Monsters' },
  { id: '1095033899492573274', name: 'Candy Bots' },
  { id: '1095033566070583457', name: 'AI BitBots' },
  { id: '1095335098112561234', name: 'FCKED CATZ' },
  { id: '1300969268665389157', name: 'RJCTD Bots' },
  { id: '1300969353952362557', name: 'Doodle Bots' },
  { id: '1300968964276621313', name: 'Money Monsters 3D' }
];

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

  // Sort roles according to ROLE_ORDER
  const sortedRoles = verifyResult?.assignedRoles?.map(roleId => {
    const role = ROLE_ORDER.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }).filter(Boolean);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaCrown className={styles.titleIcon} />
          <h2 className={styles.title}>Server Roles</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.roleList}>
            {sortedRoles?.map((role, index) => (
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