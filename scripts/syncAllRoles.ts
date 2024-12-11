import { prisma } from '../lib/prisma';

async function syncAllRoles() {
  try {
    console.log('Starting role sync for all users...');

    // Get all unique Discord IDs from Users table
    const users = await prisma.user.findMany({
      where: {
        discordId: {
          not: null
        }
      },
      select: {
        discordId: true,
        discordName: true
      }
    });

    console.log(`Found ${users.length} users to sync`);

    // Sync roles for each user
    for (const user of users) {
      if (!user.discordId) continue;
      
      console.log(`Syncing roles for ${user.discordName} (${user.discordId})`);
      
      try {
        // Cast void return to text to avoid Prisma deserialization error
        await prisma.$executeRaw`SELECT sync_user_roles(${user.discordId}::text)::text`;
        console.log(`✓ Synced roles for ${user.discordName}`);
      } catch (error) {
        console.error(`Error syncing roles for ${user.discordName}:`, error);
      }
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Role sync completed');

  } catch (error) {
    console.error('Error in syncAllRoles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncAllRoles(); 