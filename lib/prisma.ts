import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function createPrismaClient() {
    const client = new PrismaClient({
        log: ['info', 'warn', 'error'],
    });

    // Test connection with retries
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            await client.$connect();
            console.log('Successfully connected to database:', process.env.DATABASE_URL);
            return client;
        } catch (error) {
            console.error(`Connection attempt ${i + 1} failed:`, error);
            if (i < MAX_RETRIES - 1) {
                console.log(`Retrying connection... (${MAX_RETRIES - i - 1} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                throw new Error('Failed to connect to database after multiple attempts');
            }
        }
    }

    return client;
}

export const prisma = globalForPrisma.prisma || await createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});