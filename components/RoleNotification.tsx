import React from 'react';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Role Update</h3>
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
        <div className={styles.roles}>
          {roleUpdate.added.map((role, index) => (
            <div key={`added-${index}`} className={styles.role}>
              {role}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 