import { prisma } from '../lib/prisma';
import { updateDiscordRoles } from '../utils/discordRoles';

async function testRoleSync(discordId: string) {
  try {
    console.log(`Testing role sync for user ${discordId}`);

    // 1. Get current user state
    const user = await prisma.user.findUnique({
      where: { discordId },
      include: { wallets: true }
    });
    console.log('User state:', user);

    // 2. Get current roles
    const currentRoles = await prisma.roles.findUnique({
      where: { discordId }
    });
    console.log('Current roles:', currentRoles);

    // 3. Calculate role changes
    const roleChanges = await prisma.$queryRaw`
      SELECT * FROM calculate_role_changes(${discordId}::text)
    `;
    console.log('Calculated role changes:', roleChanges);

    // 4. Log role sync history
    const syncHistory = await prisma.roleSync.findMany({
      where: { discordId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log('Recent sync history:', syncHistory);

    return {
      user,
      currentRoles,
      roleChanges,
      syncHistory
    };

  } catch (error) {
    console.error('Error in testRoleSync:', error);
    throw error;
  }
}

// Add to package.json scripts
// "test:roles": "ts-node scripts/testRoleSync.ts"

// If running directly
if (require.main === module) {
  const discordId = process.argv[2];
  if (!discordId) {
    console.error('Please provide a Discord ID');
    process.exit(1);
  }

  testRoleSync(discordId)
    .then(result => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export default testRoleSync; 