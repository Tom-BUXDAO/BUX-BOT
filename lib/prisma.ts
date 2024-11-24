import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    errorFormat: 'pretty',
  })

// Add connection error handling with retries
let retries = 3;
const connectWithRetry = async () => {
  try {
    await prisma.$connect();
    console.log('Successfully connected to database:', 
      process.env.DATABASE_URL?.split('@')[1] // Only log the host part for security
    );
  } catch (e) {
    console.error('Failed to connect to database:', e);
    if (retries > 0) {
      retries--;
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      setTimeout(connectWithRetry, 2000);
    }
  }
}

connectWithRetry();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 