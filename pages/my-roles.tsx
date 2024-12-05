import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

// Exact role names and order from RoleNotification
const ROLE_ORDER = [
  { id: '1095034117877399686', name: 'MONSTER' },
  { id: '1095034117877399687', name: 'MONSTER 🐋' },
  { id: '1093606438674382858', name: 'CAT' },
  { id: '1095033566070583457', name: 'BITBOT' },
  { id: '1095033566070583458', name: 'MEGA BOT 🐋' },
  { id: '1300968964276621313', name: 'MONSTER 3D' },
  { id: '1300968964276621314', name: 'MONSTER 3D 🐋' },
  { id: '1093606438674382859', name: 'CELEB' },
  { id: '1093607056696692828', name: 'AI squirrel' },
  { id: '1095033759612547133', name: 'AI energy ape' },
  { id: '1300969268665389157', name: 'Rjctd bot' },
  { id: '1095033899492573274', name: 'Candy bot' },
  { id: '1300969353952362557', name: 'Doodle bot' },
  { id: '1248428373487784006', name: 'BUX$DAO 5' },
  { id: '1095363984581984357', name: 'BUX BANKER' }
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

  // Filter and sort roles in exact order
  const roles = ROLE_ORDER.filter(role => 
    verifyResult?.assignedRoles?.includes(role.id)
  );

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <FaCrown className={styles.titleIcon} />
          <h2 className={styles.title}>Server Roles</h2>
        </div>

        <div className={styles.infoContainer}>
          <div className={styles.roleList}>
            {roles.map(role => (
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