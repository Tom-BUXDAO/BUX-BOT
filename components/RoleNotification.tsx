import styles from '@/styles/RoleNotification.module.css';

interface RoleNotificationProps {
  roles: string[];
  onClose: () => void;
}

export default function RoleNotification({ roles, onClose }: RoleNotificationProps) {
  if (!roles.length) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.container}>
        <h2 className={styles.title}>The following roles have been assigned:</h2>
        <div className={styles.roles}>
          {roles.map((role, index) => (
            <div key={index} className={styles.role}>
              {role}
            </div>
          ))}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
} 