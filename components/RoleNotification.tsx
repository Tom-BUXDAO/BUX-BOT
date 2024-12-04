import { useEffect, useState } from 'react';
import styles from '@/styles/RoleNotification.module.css';

interface DiscordRole {
  id: string;
  name: string;
}

interface RoleNotificationProps {
  roleUpdate: {
    added: string[];
    removed: string[];
  };
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRoleNames() {
      try {
        const response = await fetch(`/api/discord/roles`);
        if (!response.ok) throw new Error('Failed to fetch roles');
        
        const roles: DiscordRole[] = await response.json();
        const roleMap = roles.reduce((acc, role) => ({
          ...acc,
          [role.id]: role.name
        }), {});
        
        setRoleNames(roleMap);
      } catch (error) {
        console.error('Error fetching role names:', error);
      }
    }

    fetchRoleNames();
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Role Updates</h3>
      <div className={styles.roleList}>
        <div className={styles.roleSection}>
          <h4>Added Roles</h4>
          {added.map(roleId => (
            <div key={roleId} className={styles.role}>
              {roleNames[roleId] || 'Loading...'}
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        title="Close notification"
        aria-label="Close role update notification"
      >
        Close
      </button>
    </div>
  );
} 