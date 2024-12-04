import styles from '@/styles/RoleNotification.module.css';

interface RoleNotificationProps {
  roleUpdate: {
    added: string[];
    removed: string[];
  };
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Role Updates</h3>
      <div className={styles.roleList}>
        <div className={styles.roleSection}>
          <h4>Added Roles</h4>
          {added.map(role => (
            <div key={role} className={styles.role}>
              {role}
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