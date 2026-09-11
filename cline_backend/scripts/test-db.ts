import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma database connection...');
  const result = await prisma.$queryRaw`SELECT NOW()`;
  console.log('Connection SUCCESS! Current DB Time:', result);
}

main()
  .catch((err) => {
    console.error('Connection FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
