import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verifying admin user...');
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        username: 'rektechuk',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isAdmin: true,
        role: true,
        createdAt: true,
      }
    });

    if (!adminUser) {
      console.error('Admin user not found.');
      return;
    }

    console.log('Admin user details:');
    console.log(JSON.stringify(adminUser, null, 2));
  } catch (error) {
    console.error('Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
