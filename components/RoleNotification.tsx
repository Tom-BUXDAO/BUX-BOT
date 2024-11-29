import styles from '@/styles/RoleNotification.module.css';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

interface Props {
  roleUpdate: RoleUpdate;
  onClose: () => void;
}

const ROLE_NAMES: { [key: string]: string } = {
  '1093607187454111825': 'Money Monsters 3D Holder',
  '1093607056696692828': 'Money Monsters Holder',
  '1095034117877399686': 'AI BitBots Holder',
  '1095033759612547133': 'FCKED CATZ Holder',
  '1095335098112561234': 'CelebCatz Holder',
  '1300969268665389157': 'Candy Bots Holder',
  '1300969353952362557': 'Doodle Bots Holder',
  '1300968964276621313': 'Energy Apes Holder',
  '1300969147441610773': 'RJCTD Bots Holder',
  '1300968613179686943': 'Squirrels Holder',
  '1300968343783735296': 'Warriors Holder',
  // Whale roles
  '1095033899492573274': 'AI BitBots Whale',
  '1095033566070583457': 'FCKED CATZ Whale',
  '1093606438674382858': 'Money Monsters Whale',
  '1093606579355525252': 'Money Monsters 3D Whale',
  // BUX roles
  '1095363984581984357': 'BUX Banker',
  '1248416679504117861': 'BUX Beginner',
  '1248417591215784019': 'BUX Saver',
  '1248417674476916809': 'BUX Builder',
  '1248428373487784006': 'BUXDAO 5'
};

export default function RoleNotification({ roleUpdate, onClose }: Props) {
  const { added, removed } = roleUpdate;

  const getRoleName = (roleId: string) => ROLE_NAMES[roleId] || roleId;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3>Role Verification Complete</h3>
        <div className={styles.section}>
          <h4>Your Current Roles:</h4>
          <ul>
            {added.map(role => (
              <li key={role} className={styles.added}>{getRoleName(role)}</li>
            ))}
          </ul>
        </div>
        {removed.length > 0 && (
          <div className={styles.section}>
            <h4>Removed Roles:</h4>
            <ul>
              {removed.map(role => (
                <li key={role} className={styles.removed}>{getRoleName(role)}</li>
              ))}
            </ul>
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