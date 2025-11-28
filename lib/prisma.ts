import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Log DATABASE_URL for debugging (kun første del for sikkerhed)
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL
  const urlParts = dbUrl.split('@')
  console.log('DATABASE_URL host:', urlParts.length > 1 ? urlParts[1] : 'N/A')
  console.log('DATABASE_URL database:', dbUrl.includes('/postgres') ? 'postgres' : dbUrl.includes('/intern_betting') ? 'intern_betting' : 'unknown')
} else {
  console.error('DATABASE_URL is not set!')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

