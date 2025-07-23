import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    transactionOptions: {
      maxWait: 10000, // default: 2000
      timeout: 20000, // default: 5000
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma