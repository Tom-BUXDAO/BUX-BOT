import React, { useEffect, useState } from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

interface RoleConfig {
  roleId: string;
  roleName: string;
  displayName: string;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const [roleNames, setRoleNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    async function fetchRoleNames() {
      try {
        const response = await fetch('/api/roles/config');
        const configs: RoleConfig[] = await response.json();

        const nameMap = configs.reduce((acc: {[key: string]: string}, config) => {
          // Use displayName if available, otherwise format roleName
          acc[config.roleId] = config.displayName || 
            config.roleName.split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace('holder', '')
              .trim();
          return acc;
        }, {});

        console.log('Role name mapping:', nameMap);
        setRoleNames(nameMap);
      } catch (error) {
        console.error('Error fetching role names:', error);
      }
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
                  {roleNames[roleId] || 'Unknown Role'}
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
                  {roleNames[roleId] || 'Unknown Role'}
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