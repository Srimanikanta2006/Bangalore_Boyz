import { PrismaClient } from '@prisma/client';

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'sa-east-1',
];

async function checkRegion(r: string) {
  const url = `postgresql://postgres.vqqpuutmpprfygedesyp:Nikhil%40here12@aws-0-${r}.pooler.supabase.com:6543/postgres`;
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRaw`SELECT NOW()`;
    console.log(`FOUND WORKING REGION [${r}]! Result:`, res);
    return true;
  } catch (e: any) {
    // ignore failed attempt
    return false;
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  console.log('Searching for active Supabase Pooler region...');
  for (const r of regions) {
    console.log(`Checking aws-0-${r}...`);
    const ok = await checkRegion(r);
    if (ok) process.exit(0);
  }
  console.log('No direct pooler region connected. Testing Supabase Direct fallback...');
}

main();
