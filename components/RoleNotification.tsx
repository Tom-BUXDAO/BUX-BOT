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
      <h3>Qualified Roles</h3>
      
      <div className={styles.section}>
        <ul>
          {roleUpdate.newRoles.map((role, index) => (
            <li key={`role-${index}`}>{role}</li>
          ))}
        </ul>
      </div>
    </div>
  );
} 