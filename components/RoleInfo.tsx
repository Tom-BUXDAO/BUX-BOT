import { NFT_THRESHOLDS, BUX_THRESHOLDS, BUXDAO_5_ROLE_ID, CollectionName } from '@/utils/roleConfig';
import styles from '@/styles/RoleInfo.module.css';

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is {
  holder: string | undefined;
  whale: { roleId: string | undefined; threshold: number };
} {
  return 'whale' in config && config.whale !== undefined;
}

export default function RoleInfo() {
  return (
    <div className={styles.roleInfoContainer}>
      <h2 className={styles.roleInfoTitle}>Available Roles</h2>
      
      <div className={styles.roleSection}>
        <h3>NFT Collections</h3>
        <ul>
          {Object.entries(NFT_THRESHOLDS).map(([collection, config]) => (
            <li key={collection}>
              {collection}
              <ul>
                {config.holder && <li>Holder</li>}
                {hasWhaleConfig(config) && (
                  <li>Whale (Hold {config.whale.threshold} NFTs)</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.roleSection}>
        <h3>BUX Token</h3>
        <ul>
          {BUX_THRESHOLDS.map((tier, index) => (
            <li key={index}>Hold {tier.threshold.toLocaleString()} BUX</li>
          ))}
        </ul>
      </div>

      {BUXDAO_5_ROLE_ID && (
        <div className={styles.roleSection}>
          <h3>Special Roles</h3>
          <ul>
            <li>BUXDAO 5 (Hold 5+ different collections)</li>
          </ul>
        </div>
      )}
    </div>
  );
} 