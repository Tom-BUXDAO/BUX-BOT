import { useEffect, useState } from 'react';
import styles from '@/styles/RoleNotification.module.css';
import { FaTimes } from 'react-icons/fa';

interface RoleNotificationProps {
  roleUpdate: {
    added: string[];
    removed: string[];
  };
  onClose: () => void;
}

interface DiscordRole {
  id: string;
  name: string;
  position: number;
}

// Define role order with exact Discord role names
const ROLE_ORDER: Record<string, { name: string; order: number }> = {
  // BUX Token roles (1-9)
  '1095363984581984357': { name: 'BUX BANKER', order: 1 },
  '1095033899492573274': { name: 'BUXDAO 5', order: 2 },
  
  // Main collections (10-19)
  '1300969268665389157': { name: 'MONSTER 3D', order: 10 },
  '1300969268665389159': { name: 'MONSTER 3D 🐋', order: 11 },
  '1093607056696692828': { name: 'MONSTER', order: 12 },
  '1300969268665389158': { name: 'MONSTER 🐋', order: 13 },
  '1093606438674382858': { name: 'CAT', order: 14 },
  '1300968964276621314': { name: 'MEGA BOT 🐋', order: 15 },
  '1300968964276621313': { name: 'AI BITBOT', order: 16 },
  '1300968964276621315': { name: 'CELEB CAT', order: 17 },
  
  // Collab collections (20-29)
  '1095033759612547133': { name: 'AI squirrel', order: 20 },
  '1300968613179686943': { name: 'AI energy ape', order: 21 },
  '1300968964276621316': { name: 'Rjctd bot', order: 22 },
  '1300969147441610773': { name: 'Candy bot', order: 23 },
  '1300968964276621317': { name: 'Doodle bot', order: 24 }
};

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;

  // Filter unique roles and sort by order
  const uniqueRoles = [...new Set(added)]
    .sort((a, b) => (ROLE_ORDER[a]?.order || 999) - (ROLE_ORDER[b]?.order || 999))
    .filter(role => ROLE_ORDER[role]); // Only show roles we know about

  if (uniqueRoles.length === 0) return null;

  return (
    <div className={styles.container}>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        title="Close notification"
        aria-label="Close role assignment notification"
      >
        <FaTimes />
      </button>
      <h3 className={styles.title}>Roles Assigned</h3>
      <div className={styles.roleList}>
        {uniqueRoles.map(role => (
          <div key={role} className={styles.role}>
            {ROLE_ORDER[role].name}
          </div>
        ))}
      </div>
    </div>
  );
} 