import styles from '@/styles/RoleNotification.module.css';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

interface Props {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

// Match exact Discord server role names and emojis
const ROLE_NAMES: { [key: string]: { name: string; emoji: string } } = {
  '1093607187454111825': { name: 'Money Monsters 3D', emoji: '🎮' },
  '1093607056696692828': { name: 'Money Monsters', emoji: '💰' },
  '1095034117877399686': { name: 'AI BitBots', emoji: '🤖' },
  '1095033759612547133': { name: 'FCKED CATZ', emoji: '😼' },
  '1095335098112561234': { name: 'CelebCatz', emoji: '⭐' },
  '1300969268665389157': { name: 'Candy Bots', emoji: '🍭' },
  '1300969353952362557': { name: 'Doodle Bots', emoji: '🎨' },
  '1300968964276621313': { name: 'Energy Apes', emoji: '⚡' },
  '1300969147441610773': { name: 'RJCTD Bots', emoji: '🚫' },
  '1300968613179686943': { name: 'Squirrels', emoji: '🐿️' },
  '1300968343783735296': { name: 'Warriors', emoji: '⚔️' },
  // Whale roles
  '1095033899492573274': { name: 'AI BitBots Whale', emoji: '🐳' },
  '1095033566070583457': { name: 'FCKED CATZ Whale', emoji: '🐳' },
  '1093606438674382858': { name: 'Money Monsters Whale', emoji: '🐳' },
  '1093606579355525252': { name: 'Money Monsters 3D Whale', emoji: '🐳' },
  // BUX roles
  '1095363984581984357': { name: 'BUX Banker', emoji: '💰' },
  '1248416679504117861': { name: 'BUX Beginner', emoji: '🌱' },
  '1248417591215784019': { name: 'BUX Saver', emoji: '💎' },
  '1248417674476916809': { name: 'BUX Builder', emoji: '🏗️' },
  '1248428373487784006': { name: 'BUXDAO 5', emoji: '🏆' }
};

export default function RoleNotification({ roleUpdate, onClose }: Props) {
  const { added, removed } = roleUpdate;

  const getRoleDisplay = (roleId: string) => {
    const role = ROLE_NAMES[roleId] || { name: roleId, emoji: '❓' };
    return (
      <span className={styles.roleText}>
        <span className={styles.roleEmoji}>{role.emoji}</span>
        <span className={styles.roleName}>{role.name}</span>
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3>Role Verification Complete</h3>
        <div className={styles.section}>
          <h4>Your Current Roles</h4>
          <div className={styles.roleList}>
            {added.map(role => (
              <div key={role} className={styles.role}>
                {getRoleDisplay(role)}
              </div>
            ))}
          </div>
        </div>
        {removed.length > 0 && (
          <div className={styles.section}>
            <h4>Removed Roles</h4>
            <div className={styles.roleList}>
              {removed.map(role => (
                <div key={role} className={`${styles.role} ${styles.removed}`}>
                  {getRoleDisplay(role)}
                </div>
              ))}
            </div>
          </div>
        )}
        {added.length === 0 && (
          <div className={styles.section}>
            <p>No roles assigned</p>
          </div>
        )}
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
} 