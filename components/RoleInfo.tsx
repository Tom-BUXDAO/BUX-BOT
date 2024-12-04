import { useWalletVerification } from '@/contexts/WalletVerificationContext';
import styles from '@/styles/RoleInfo.module.css';

export default function RoleInfo() {
  const { verifyResult } = useWalletVerification();

  if (!verifyResult?.roleUpdate) return null;

  const { added, removed } = verifyResult.roleUpdate;
  const hasChanges = added.length > 0 || removed.length > 0;

  if (!hasChanges) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2 className={styles.roleInfoTitle}>Role Updates</h2>
        
        {added.length > 0 && (
          <div className={styles.roleSection}>
            <h3>Added Roles</h3>
            <ul>
              {added.map(role => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </div>
        )}
        
        {removed.length > 0 && (
          <div className={styles.roleSection}>
            <h3>Removed Roles</h3>
            <ul>
              {removed.map(role => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 