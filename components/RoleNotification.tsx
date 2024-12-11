import React, { useEffect, useState } from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';
import { prisma } from '@/lib/prisma';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const [roleNames, setRoleNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Fetch display names for all roles
    async function fetchRoleNames() {
      const configs = await prisma.roleConfig.findMany({
        where: {
          roleId: {
            in: [...roleUpdate.added, ...roleUpdate.removed]
          }
        },
        select: {
          roleId: true,
          displayName: true
        }
      });

      const nameMap = configs.reduce((acc, config) => {
        acc[config.roleId] = config.displayName || config.roleId;
        return acc;
      }, {} as {[key: string]: string});

      setRoleNames(nameMap);
    }

    fetchRoleNames();
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
                  {roleNames[roleId] || roleId}
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
                  {roleNames[roleId] || roleId}
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