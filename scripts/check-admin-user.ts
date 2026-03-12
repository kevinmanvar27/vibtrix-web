import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { 
      id: true,
      username: true, 
      email: true, 
      displayName: true, 
      passwordHash: true,
      role: true,
      isActive: true
    }
  });
  
  console.log('Admin User Details:');
  console.log(JSON.stringify(admin, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
