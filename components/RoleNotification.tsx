import React from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID } from '@/utils/roleConfig';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

// Get ordered list of role IDs we manage
const getOrderedRoleIds = () => {
  const orderedCollections = [
    'Money Monsters',
    'Money Monsters 🐋',
    'FCKED CATZ',
    'FCKED CATZ 🐋',
    'AI BitBots',
    'AI BitBots 🐋',
    'Money Monsters 3D',
    'Money Monsters 3D 🐋',
    'CelebCatz',
    'Warriors',
    'Squirrels',
    'Energy Apes',
    'RJCTD Bots',
    'Candy Bots',
    'Doodle Bots',
    'BUX$DAO 5'
  ];

  return orderedCollections;
};

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  // Filter and order roles
  const orderedRoleNames = getOrderedRoleIds();
  const managedRoles = roleUpdate.newRoles.filter(role => 
    orderedRoleNames.includes(role)
  ).sort((a, b) => 
    orderedRoleNames.indexOf(a) - orderedRoleNames.indexOf(b)
  );

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Qualified Roles</h3>
        </div>
        <div className={styles.roles}>
          {managedRoles.map((role, index) => (
            <div key={`role-${index}`} className={styles.role}>
              {role}
            </div>
          ))}
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
} 