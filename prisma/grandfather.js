require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true }
  });
  console.log('✅ Grandfathered', result.count, 'existing users as emailVerified=true');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
