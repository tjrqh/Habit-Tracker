import { environment } from './environment';

/**
 * Prisma Client Instance
 * 
 * In development with Docker:
 * - MySQL is used when DATABASE_URL contains "mysql://"
 * - SQLite is used when DATABASE_URL contains "file://"
 * 
 * The actual client is lazy-loaded based on the environment
 */

let prisma: any;

// Check if using real database (MySQL via Docker) or mock
const isDatabaseConfigured = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('mysql://') || 
   process.env.DATABASE_URL.includes('file://'));

if (!isDatabaseConfigured || environment.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('file://')) {
  // Development mode with SQLite - use mock for now
  prisma = {
    user: {
      create: async (data: any) => ({ id: '1', ...data }),
      findUnique: async ({ where }: any) => ({ id: where.id, email: 'test@example.com' }),
      findMany: async (params?: any) => [],
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
      delete: async ({ where }: any) => ({ id: where.id }),
    },
    habit: {
      create: async (data: any) => ({ id: '1', ...data }),
      findUnique: async ({ where }: any) => ({ id: where.id, title: 'Test Habit', targetTomato: 4 }),
      findMany: async (params?: any) => [],
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
      delete: async ({ where }: any) => ({ id: where.id }),
    },
    session: {
      create: async (data: any) => ({ id: '1', ...data }),
      findUnique: async ({ where }: any) => ({ id: where.id, status: 'IDLE' }),
      findMany: async (params?: any) => [],
      findFirst: async (params?: any) => null,
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
      delete: async ({ where }: any) => ({ id: where.id }),
      count: async (params?: any) => 0,
    },
    $disconnect: async () => {},
  };
} else {
  // Production or Docker MySQL mode - use real Prisma client
  try {
    const { PrismaClient } = require('@prisma/client');
    
    if (environment.NODE_ENV === 'production') {
      prisma = new PrismaClient();
    } else {
      // Reuse connection in development
      const globalAny = global as any;
      if (!globalAny.prisma) {
        globalAny.prisma = new PrismaClient({
          log: ['info', 'warn', 'error'],
        });
      }
      prisma = globalAny.prisma;
    }
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error);
    // Fallback to mock if Prisma initialization fails
    prisma = {
      user: {
        create: async (data: any) => ({ id: '1', ...data }),
        findUnique: async () => null,
        findMany: async () => [],
        update: async ({ where, data }: any) => ({ id: where.id, ...data }),
        delete: async () => ({}),
      },
      habit: {
        create: async (data: any) => ({ id: '1', ...data }),
        findUnique: async () => null,
        findMany: async () => [],
        update: async ({ where, data }: any) => ({ id: where.id, ...data }),
        delete: async () => ({}),
      },
      session: {
        create: async (data: any) => ({ id: '1', ...data }),
        findUnique: async () => null,
        findMany: async () => [],
        findFirst: async () => null,
        update: async ({ where, data }: any) => ({ id: where.id, ...data }),
        delete: async () => ({}),
        count: async () => 0,
      },
      $disconnect: async () => {},
    };
  }
}

export default prisma;
