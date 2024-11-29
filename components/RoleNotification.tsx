import styles from '@/styles/RoleNotification.module.css';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

interface Props {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

export default function RoleNotification({ roleUpdate, onClose }: Props) {
  const { added, removed } = roleUpdate;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3>Role Updates</h3>
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
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
} 