import { prisma } from '../lib/prisma';

async function fixRoles() {
  try {
    console.log('Starting role fix...');
    
    // Just call the existing sync_user_roles function
    await prisma.$executeRaw`SELECT sync_user_roles('931160720261939230'::text)::text`;
    
    // Verify the roles were updated
    const roles = await prisma.roles.findUnique({
      where: { discordId: '931160720261939230' }
    });
    
    console.log('Updated roles:', roles);
    console.log('Role fix completed successfully');
    
  } catch (error) {
    console.error('Error fixing roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoles(); 