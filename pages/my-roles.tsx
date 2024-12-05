import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import { useWalletVerification } from '@/contexts/WalletVerificationContext';

// Map role IDs to their exact display names from RoleNotification
const ROLE_NAMES: { [key: string]: string } = {
  '1095034117877399686': 'MONSTER',
  '1095034117877399687': 'MONSTER 🐋',
  '1093606438674382858': 'CAT',
  '1095033566070583457': 'BITBOT',
  '1095033566070583458': 'MEGA BOT 🐋',
  '1300968964276621313': 'MONSTER 3D',
  '1300968964276621314': 'MONSTER 3D 🐋',
  '1093606438674382859': 'CELEB',
  '1093607056696692828': 'AI squirrel',
  '1095033759612547133': 'AI energy ape',
  '1300969268665389157': 'Rjctd bot',
  '1095033899492573274': 'Candy bot',
  '1300969353952362557': 'Doodle bot',
  '1248428373487784006': 'BUX$DAO 5',
  '1095363984581984357': 'BUX BANKER'
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

  // Get filtered roles from verifyResult
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