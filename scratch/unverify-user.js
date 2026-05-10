const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'SahanResearch252@gmail.com' },
    data: { emailVerified: false }
  });
  console.log('User unverified:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
