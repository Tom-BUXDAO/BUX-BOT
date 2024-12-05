import React from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

// Define the role display order
const ROLE_ORDER = [
  'MONSTER',
  'MONSTER 🐋',
  'CAT',
  'CAT 🐋',
  'BITBOT',
  'MEGA BOT 🐋',
  'MONSTER 3D',
  'MONSTER 3D 🐋',
  'CELEB',
  'AI squirrel',
  'AI energy ape',
  'Rjctd bot',
  'Candy bot',
  'Doodle bot',
  'BUX$DAO 5',
  'BUX BANKER'
];

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  // Filter and sort roles based on our order
  const displayRoles = roleUpdate.newRoles
    .filter(name => ROLE_ORDER.includes(name))
    .sort((a, b) => 
      ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)
    );

  console.log('All roles:', roleUpdate.newRoles);
  console.log('Filtered roles:', displayRoles);

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Role Update</h3>
        </div>
        <div className={styles.roles}>
          {displayRoles.map((role, index) => (
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