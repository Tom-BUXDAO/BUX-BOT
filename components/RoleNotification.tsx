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
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
      <h3>Role Update</h3>
      
      {roleUpdate.added.length > 0 && (
        <div className={styles.section}>
          <h4>Added Roles:</h4>
          <ul>
            {roleUpdate.added.map((role, index) => (
              <li key={`added-${index}`}>{role}</li>
            ))}
          </ul>
        </div>
      )}

      {roleUpdate.removed.length > 0 && (
        <div className={styles.section}>
          <h4>Removed Roles:</h4>
          <ul>
            {roleUpdate.removed.map((role, index) => (
              <li key={`removed-${index}`}>{role}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 