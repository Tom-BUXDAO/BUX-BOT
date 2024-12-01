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
  '1095363984581984357': '💰 BUX BANKER',
  '1093607187454111825': '💵 BUX SAVER',
  '1095033899492573274': '🎯 BUXDAO 5',
  '1093607056696692828': '🧟 MONEY MONSTERS',
  '1093606438674382858': '😺 FCKED CATZ',
  '1300968964276621313': '🤖 AI BITBOT',
  '1300969268665389157': '🐋 MONEY MONSTERS 3D',
  '1300968964276621315': '🌟 CELEB CATZ',
  '1095033759612547133': '🐿️ AI SQUIRREL',
  '1300968613179686943': '🦍 AI ENERGY APE',
  '1300968964276621316': '❌ REJECTED BOT',
  '1300969147441610773': '🍬 CANDY BOT',
  '1300968964276621317': '🎨 DOODLE BOT',
  '1300968964276621314': '🐳 BITBOT WHALE'
};

const ROLE_ORDER: Record<string, number> = {
  '1095363984581984357': 1,  // BUX BANKER
  '1093607187454111825': 2,  // BUX SAVER
  '1095033899492573274': 3,  // BUXDAO 5
  '1093607056696692828': 10, // MONEY MONSTERS
  '1093606438674382858': 11, // FCKED CATZ
  '1300968964276621313': 12, // AI BITBOT
  '1300969268665389157': 13, // MONEY MONSTERS 3D
  '1300968964276621315': 14, // CELEB CATZ
  '1095033759612547133': 20, // AI SQUIRREL
  '1300968613179686943': 21, // AI ENERGY APE
  '1300968964276621316': 22, // REJECTED BOT
  '1300969147441610773': 23, // CANDY BOT
  '1300968964276621317': 24, // DOODLE BOT
  '1300968964276621314': 30  // BITBOT WHALE
};

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added } = roleUpdate;
  
  const uniqueRoles = [...new Set(added)]
    .filter(role => ROLE_NAMES[role])
    .sort((a, b) => (ROLE_ORDER[a] || 999) - (ROLE_ORDER[b] || 999));

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