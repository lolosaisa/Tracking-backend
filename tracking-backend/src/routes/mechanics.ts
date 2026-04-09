export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'error', 'warn'], // logs every SQL query in dev — very useful
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}