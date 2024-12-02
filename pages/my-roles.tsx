import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import styles from '@/styles/MyRoles.module.css';
import { FaCrown } from 'react-icons/fa';
import layoutStyles from '@/styles/Layout.module.css';

interface DiscordRole {
  id: string;
  name: string;
  color: number;
}

export default function MyRolesPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        // Get user's current roles
        const userResponse = await fetch(`/api/users/${session?.user?.id}`);
        const userData = await userResponse.json();
        
        // Get all Discord roles to get names and colors
        const rolesResponse = await fetch('/api/discord/roles');
        const allRoles = await rolesResponse.json();
        
        // Match user roles with Discord role data
        const userRoles = allRoles.filter((role: DiscordRole) => 
          userData.roles?.includes(role.id)
        );
        
        setRoles(userRoles);
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchRoles();
    }
  }, [session]);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={layoutStyles.pageHeader}>
          <FaCrown className={layoutStyles.pageIcon} />
          <h2>My Roles</h2>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading roles...</div>
        ) : (
          <div className={styles.roleGrid}>
            {roles.map(role => {
              const color = `#${role.color.toString(16).padStart(6, '0')}`;
              return (
                <div 
                  key={role.id} 
                  className={styles.roleCard}
                  data-color={color}
                  onLoad={(e) => {
                    const element = e.currentTarget;
                    element.style.setProperty('--role-color', color);
                    element.style.setProperty('--role-bg-color', `${color}15`);
                  }}
                >
                  <span className={styles.roleName}>{role.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
} 