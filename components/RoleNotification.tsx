import styles from '@/styles/RoleNotification.module.css';
import { FaTimes } from 'react-icons/fa';

interface RoleNotificationProps {
  roleUpdate: {
    added: string[];
    removed: string[];
  };
  onClose: () => void;
}

const ROLE_NAMES: Record<string, string> = {
  '1095363984581984357': 'BUX BANKER',
  '1093607187454111825': 'BUX SAVER',
  '1093606579355525252': 'BUX BUILDER',
  '1095034117877399686': 'BUX BEGINNER',
  '1095033899492573274': 'BUXDAO 5',
  '1300969268665389157': 'MONSTER 3D WHALE',
  '1300968964276621313': 'BITBOT',
  '1300968964276621314': 'BITBOT WHALE',
  '1300969147441610773': 'CANDY BOT',
  '1093607056696692828': 'MONSTER',
  '1093606438674382858': 'CAT',
  '1300968964276621315': 'CELEB CAT',
  '1095033759612547133': 'AI SQUIRREL',
  '1300968613179686943': 'AI ENERGY APE',
  '1300968964276621316': 'REJECTED BOT',
  '1300968964276621317': 'DOODLE BOT'
};

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;
  
  const uniqueRoles = [...new Set(added)].filter(role => ROLE_NAMES[role]);

  if (uniqueRoles.length === 0) return null;

  return (
    <div className={styles.container}>
      <button 
        onClick={onClose} 
        className={styles.closeButton}
        title="Close notification"
        aria-label="Close role assignment notification"
      >
        <FaTimes />
      </button>
      <h3 className={styles.title}>Roles Assigned</h3>
      <div className={styles.roleList}>
        {uniqueRoles.map(role => (
          <div key={role} className={styles.role}>
            {ROLE_NAMES[role]}
          </div>
        ))}
      </div>
    </div>
  );
} 