import { PrismaClient } from '@prisma/client';

const poolerRegions = [
  'postgresql://postgres:Nikhil%40here12@db.vqqpuutmpprfygedesyp.supabase.co:5432/postgres?sslmode=require',
  'postgresql://postgres.vqqpuutmpprfygedesyp:Nikhil%40here12@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.vqqpuutmpprfygedesyp:Nikhil%40here12@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.vqqpuutmpprfygedesyp:Nikhil%40here12@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.vqqpuutmpprfygedesyp:Nikhil%40here12@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
];

async function check(url: string) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRaw`SELECT 1 as connected`;
    console.log('SUCCESS:', url);
    return true;
  } catch (e: any) {
    console.log('FAILED:', url, '->', e.message?.split('\n')[0]);
    return false;
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  for (const url of poolerRegions) {
    await check(url);
  }
}

main();
