import React from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

// Define the ordered role display names - EXACT Discord role names
const ORDERED_ROLES = [
  'MONSTER',          // Money Monsters holder
  'MONSTER 🐋',       // Money Monsters whale
  'FCKED CATZ',      // FCKED CATZ holder
  'FCKED CATZ 🐋',   // FCKED CATZ whale
  'BITBOT',          // AI BitBots holder
  'MEGA BOT 🐋',     // AI BitBots whale
  'MONSTER 3D',      // Money Monsters 3D holder
  'MONSTER 3D 🐋',   // Money Monsters 3D whale
  'CELEB',           // CelebCatz
  'AI warrior',      // Warriors
  'AI squirrel',     // Squirrels
  'AI energy ape',   // Energy Apes
  'Rjctd bot',       // RJCTD Bots
  'Candy bot',       // Candy Bots
  'Doodle bot',      // Doodle Bots
  'BUX$DAO 5',       // BUX DAO 5 collections
  'BUX BANKER',      // BUX token role
  'FCKED CATZ'       // Added missing role
];

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  // Filter and sort roles based on our order
  const displayRoles = roleUpdate.newRoles
    .filter(role => ORDERED_ROLES.includes(role))
    .sort((a, b) => 
      ORDERED_ROLES.indexOf(a) - ORDERED_ROLES.indexOf(b)
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