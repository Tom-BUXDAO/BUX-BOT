import { useEffect, useState } from 'react';
import styles from '../styles/RoleNotification.module.css';
import { FaTimes } from 'react-icons/fa';

interface RoleNotificationProps {
  roles: string[];
  onClose: () => void;
}

export default function RoleNotification({ roles, onClose }: RoleNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.notification}>
        <button 
          onClick={handleClose} 
          className={styles.closeButton}
          aria-label="Close notification"
          title="Close"
        >
          <FaTimes />
        </button>
        <h3>Roles Updated</h3>
        <div className={styles.content}>
          <p>The following roles have been assigned:</p>
          <ul>
            {roles.map((role, index) => (
              <li key={index}>{role}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 