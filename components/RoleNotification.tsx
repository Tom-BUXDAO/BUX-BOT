import { useEffect, useState } from 'react';
import styles from '@/styles/RoleNotification.module.css';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, CollectionName } from '@/utils/roleConfig';

interface RoleNotificationProps {
  roleUpdate: {
    added: string[];
    removed: string[];
  };
  onClose: () => void;
}

function hasWhaleConfig(config: typeof NFT_THRESHOLDS[CollectionName]): config is {
  holder: string | undefined;
  whale: { roleId: string | undefined; threshold: number };
} {
  return 'whale' in config && config.whale !== undefined;
}

// Map role IDs to human-readable names
function getRoleName(roleId: string): string {
  // NFT Collection roles
  for (const [collection, config] of Object.entries(NFT_THRESHOLDS)) {
    if (config.holder === roleId) return `${collection} Holder`;
    if (hasWhaleConfig(config) && config.whale.roleId === roleId) return `${collection} Whale`;
  }

  // BUX Token roles
  const buxRoles = [
    { id: process.env.BUX_BEGINNER_ROLE_ID, name: 'BUX Beginner' },
    { id: process.env.BUX_BUILDER_ROLE_ID, name: 'BUX Builder' },
    { id: process.env.BUX_SAVER_ROLE_ID, name: 'BUX Saver' },
    { id: process.env.BUX_BANKER_ROLE_ID, name: 'BUX Banker' }
  ];
  
  const buxRole = buxRoles.find(role => role.id === roleId);
  if (buxRole) return buxRole.name;

  // Special roles
  if (roleId === process.env.BUXDAO_5_ROLE_ID) return 'BUXDAO 5';

  return roleId;
}

export default function RoleNotification({ roleUpdate, onClose }: RoleNotificationProps) {
  const { added, removed } = roleUpdate;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Role Updates</h3>
      <div className={styles.roleList}>
        {added.length > 0 ? (
          <div className={styles.roleSection}>
            <h4>Added Roles</h4>
            {added.map(roleId => (
              <div key={roleId} className={styles.role}>
                {getRoleName(roleId)}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.roleSection}>
            <div className={styles.role}>No new roles added</div>
          </div>
        )}
        
        {removed.length > 0 ? (
          <div className={styles.roleSection}>
            <h4>Removed Roles</h4>
            {removed.map(roleId => (
              <div key={roleId} className={styles.role}>
                {getRoleName(roleId)}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.roleSection}>
            <div className={styles.role}>No roles removed</div>
          </div>
        )}
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