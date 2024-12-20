import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, MAIN_COLLECTIONS } from '@/utils/roleConfig';
import styles from '@/styles/RoleInfo.module.css';

export default function RoleInfo() {
  return (
    <div className={styles.roleInfoContainer}>
      <h2 className={styles.roleInfoTitle}>Role Assignment Info</h2>
      
      <div className={styles.roleSection}>
        <h3>Collection Roles</h3>
        <ul>
          <li>Holder roles for each collection you own</li>
          <li>
            Whale roles for:
            <ul>
              <li>10+ AI Bitbots</li>
              <li>25+ Fcked Catz</li>
              <li>25+ Money Monsters</li>
              <li>25+ Money Monsters 3D</li>
            </ul>
          </li>
        </ul>
      </div>

      <div className={styles.roleSection}>
        <h3>$BUX Token Roles</h3>
        <ul>
          <li>BUX Beginner: 2,500+ $BUX</li>
          <li>BUX Builder: 10,000+ $BUX</li>
          <li>BUX Saver: 25,000+ $BUX</li>
          <li>BUX Banker: 50,000+ $BUX</li>
        </ul>
      </div>

      <div className={styles.roleSection}>
        <h3>Special Roles</h3>
        <ul>
          <li>
            BUXDAO 5: Hold at least 1 NFT from each main collection:
            <ul>
              {MAIN_COLLECTIONS.map(collection => (
                <li key={collection}>{collection}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
} 