import { PrismaClient, Prisma } from '@prisma/client'
import { rateLimit } from '@/utils/rateLimit'

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient;
    connectionPromise: Promise<void>;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const MAX_TIMEOUT = 30000;

const prismaClientOptions: Prisma.PrismaClientOptions = {
    log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        }
    }
};

async function waitForDatabase(client: PrismaClient, attempt = 1): Promise<void> {
    try {
        await client.$connect();
        console.log('Successfully connected to database:', process.env.DATABASE_URL);
    } catch (error) {
        if (attempt >= MAX_RETRIES) {
            console.error('Failed to connect after max retries:', error);
            throw error;
        }

        const delay = Math.min(RETRY_DELAY * Math.pow(2, attempt - 1), MAX_TIMEOUT);
        console.log(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return waitForDatabase(client, attempt + 1);
    }
}

async function createPrismaClient() {
    const client = new PrismaClient(prismaClientOptions);

    try {
        await waitForDatabase(client);
        return client;
    } catch (error) {
        await client.$disconnect();
        throw new Error('Failed to establish database connection');
    }
}

// Create singleton instance
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Initialize connection lazily with retries
if (!globalForPrisma.connectionPromise) {
    globalForPrisma.connectionPromise = waitForDatabase(prisma).catch(error => {
        console.error('Fatal database connection error:', error);
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
                console.log('Database connection lost, attempting to reconnect...');
                await waitForDatabase(prisma);
                return next(params);
            }
        }
        throw error;
    }
});

// Log events with proper types
type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};

prisma.$on('warn' as never, (e: LogEvent) => {
    console.warn('Database warning:', e.message, {
        timestamp: e.timestamp,
        target: e.target
    });
});

prisma.$on('error' as never, (e: LogEvent) => {
    console.error('Database error:', e.message, {
        timestamp: e.timestamp,
        target: e.target
    });
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});