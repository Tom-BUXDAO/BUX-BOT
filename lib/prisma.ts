import { PrismaClient, Prisma } from '@prisma/client'
import { rateLimit } from '@/utils/rateLimit'

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient;
    connectionPromise: Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CONNECTION_POOL_SIZE = 10;

const prismaClientOptions: Prisma.PrismaClientOptions = {
    log: [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        }
    }
};

async function createPrismaClient() {
    const client = new PrismaClient(prismaClientOptions);

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

// Create singleton instance
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Initialize connection lazily
if (!globalForPrisma.connectionPromise) {
    globalForPrisma.connectionPromise = prisma.$connect().catch(error => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    });
}

// Add connection pooling middleware
prisma.$use(async (params, next) => {
    // Apply rate limiting
    await rateLimit();
    
    // Ensure connection is established
    await globalForPrisma.connectionPromise;
    
    try {
        return await next(params);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P1001' || error.code === 'P1002') {
                // Connection error - retry
                console.log('Reconnecting to database...');
                await prisma.$connect();
                return next(params);
            }
        }
        throw error;
    }
});

// Log events
prisma.$on('query', (e) => {
    console.log('Query:', e);
});

prisma.$on('warn', (e) => {
    console.warn('Warning:', e);
});

prisma.$on('error', (e) => {
    console.error('Error:', e);
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});