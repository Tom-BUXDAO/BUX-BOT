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

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added, removed } = roleUpdate;
  const hasChanges = added.length > 0 || removed.length > 0;

  if (!hasChanges) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Role Updates</h3>
      <div className={styles.roleList}>
        {added.length > 0 && (
          <div className={styles.roleSection}>
            <h4>Added Roles</h4>
            {added.map(role => (
              <div key={role} className={styles.role}>
                {role}
              </div>
            ))}
          </div>
        )}
        {removed.length > 0 && (
          <div className={styles.roleSection}>
            <h4>Removed Roles</h4>
            {removed.map(role => (
              <div key={role} className={styles.role}>
                {role}
              </div>
            ))}
          </div>
        )}
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