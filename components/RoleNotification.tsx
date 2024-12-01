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

  return (
    <div className={styles.container}>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        title="Close notification"
        aria-label="Close role update notification"
      >
        <FaTimes />
      </button>
      <h3 className={styles.title}>Role Updates</h3>
      {added.length > 0 && (
        <div className={styles.section}>
          <h4>Added Roles:</h4>
          <ul>
            {added.map(role => (
              <li key={role} className={styles.added}>{role}</li>
            ))}
          </ul>
        </div>
      )}
      {removed.length > 0 && (
        <div className={styles.section}>
          <h4>Removed Roles:</h4>
          <ul>
            {removed.map(role => (
              <li key={role} className={styles.removed}>{role}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 