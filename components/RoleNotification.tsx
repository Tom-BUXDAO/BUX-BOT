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

// Define role order
const ROLE_ORDER: Record<string, number> = {
  // BUX Token roles (1-9)
  '1095363984581984357': 1,  // BUX BANKER
  '1095033899492573274': 2,  // BUXDAO 5
  
  // Main collections (10-19)
  '1300969268665389157': 10, // MONSTER 3D WHALE
  '1093607056696692828': 11, // MONSTER
  '1093606438674382858': 12, // FCKED CATZ
  '1300968964276621314': 13, // BITBOT WHALE
  '1300968964276621313': 14, // AI BITBOT
  '1300968964276621315': 15, // CELEB CAT
  
  // Collab collections (20-29)
  '1095033759612547133': 20, // AI SQUIRREL
  '1300968613179686943': 21, // AI ENERGY APE
  '1300968964276621316': 22, // REJECTED BOT
  '1300969147441610773': 23, // CANDY BOT
  '1300968964276621317': 24  // DOODLE BOT
};

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;
  const [discordRoles, setDiscordRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetchRoles() {
      try {
        const response = await fetch('/api/discord/roles');
        if (response.ok && mounted) {
          const roles: DiscordRole[] = await response.json();
          const roleMap = roles.reduce((acc, role) => {
            acc[role.id] = role.name;
            return acc;
          }, {} as Record<string, string>);
          setDiscordRoles(roleMap);
        }
      } catch (error) {
        console.error('Failed to fetch Discord roles:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchRoles();
    return () => { mounted = false; };
  }, []);

  // Filter unique roles and sort by order
  const uniqueRoles = [...new Set(added)]
    .sort((a, b) => (ROLE_ORDER[a as keyof typeof ROLE_ORDER] || 999) - (ROLE_ORDER[b as keyof typeof ROLE_ORDER] || 999));

  if (uniqueRoles.length === 0 || isLoading) return null;

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
            {discordRoles[role]}
          </div>
        ))}
      </div>
    </div>
  );
} 