import React, { useEffect, useState } from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const [roleNames, setRoleNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Fetch display names from API instead of using Prisma directly
    async function fetchRoleNames() {
      const response = await fetch('/api/roles/config');
      const configs = await response.json();

      const nameMap = configs.reduce((acc: {[key: string]: string}, config: any) => {
        acc[config.roleId] = config.displayName || config.roleName;
        return acc;
      }, {});

      setRoleNames(nameMap);
    }

    if (roleUpdate.added.length > 0 || roleUpdate.removed.length > 0) {
      fetchRoleNames();
    }
  }, [roleUpdate]);

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Role Update</h3>
        </div>
        {roleUpdate.added.length > 0 && (
          <>
            <h4>Added Roles:</h4>
            <div className={styles.roles}>
              {roleUpdate.added.map(roleId => (
                <div key={`added-${roleId}`} className={styles.role}>
                  {roleNames[roleId] || 'Loading...'}
                </div>
              ))}
            </div>
          </>
        )}
        {roleUpdate.removed.length > 0 && (
          <>
            <h4>Removed Roles:</h4>
            <div className={styles.roles}>
              {roleUpdate.removed.map(roleId => (
                <div key={`removed-${roleId}`} className={styles.role}>
                  {roleNames[roleId] || 'Loading...'}
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
} 