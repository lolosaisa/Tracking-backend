//This file ensure that only one database connection pool is created and it will be imported by all the routes and the server.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'error', 'warn'], // logs every SQL query in dev — very useful
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}