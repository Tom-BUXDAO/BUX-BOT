import React from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

// Define the ordered role display names
const ORDERED_ROLES = [
  'MONSTER',
  'MONSTER 🐋',
  'FCKED CATZ',
  'FCKED CATZ 🐋',
  'MEGA BOT',
  'MEGA BOT 🐋',
  'MONSTER 3D',
  'MONSTER 3D 🐋',
  'CELEB',
  'AI warrior',
  'AI squirrel',
  'AI energy ape',
  'RJCTD bot',
  'Candy bot',
  'Doodle bot',
  'BUX$DAO 5',
  'BUX BANKER'
];

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  // Filter and sort roles based on our order
  const displayRoles = roleUpdate.newRoles
    .filter(role => ORDERED_ROLES.includes(role))
    .sort((a, b) => 
      ORDERED_ROLES.indexOf(a) - ORDERED_ROLES.indexOf(b)
    );

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