import React from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from '../styles/RoleNotification.module.css';
import type { RoleUpdate } from '@/types/verification';

interface RoleNotificationProps {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  return (
    <div className={styles.notification}>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        title="Close notification"
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Role Update</h3>
        </div>
        <div className={styles.roles}>
          {roleUpdate.added.length > 0 && (
            <div className={styles.added}>
              <span>Added:</span>
              {roleUpdate.added.map((role, index) => (
                <div key={`added-${index}`} className={styles.role}>
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 