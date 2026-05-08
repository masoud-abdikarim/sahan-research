import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("Prisma Error: DATABASE_URL is not set in environment variables!");
}

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error("Prisma Client cannot be initialized because DATABASE_URL is not set in environment variables.");
  }
  
  try {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  } catch (error: any) {
    console.error("Failed to initialize Prisma Client:", error.message);
    throw error;
  }
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
