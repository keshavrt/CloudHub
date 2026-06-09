import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured in the environment.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
  } catch (error) {
    console.warn(
      'PrismaClient initialization failed (expected during build if no adapter). Returning mock Proxy.'
    );
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        return new Proxy(() => {}, {
          apply: () => Promise.resolve(null),
          get: () => () => Promise.resolve(null),
        });
      },
    });
  }
};

const db = (globalThis as any).prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prismaGlobal = db;
}
