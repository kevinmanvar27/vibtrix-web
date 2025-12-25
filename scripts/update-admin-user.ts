import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Updating admin user...');
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'rektechuk' },
          { email: 'rektech.uk@gmail.com' }
        ]
      }
    });

    if (!adminUser) {
      console.error('Admin user not found. Please run npm run create-admin first.');
      return;
    }

    // Hash the new password
    const passwordHash = await hash('RekTech@27', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update the admin user with the specified credentials and SUPER_ADMIN role
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        username: 'rektechuk',
        displayName: 'RekTech Admin',
        email: 'rektech.uk@gmail.com',
        passwordHash,
        isAdmin: true,
        role: UserRole.SUPER_ADMIN,
      }
    });

    console.log('Admin user updated successfully!');
    console.log(`Username: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log('Password has been updated to: RekTech@27');
  } catch (error) {
    console.error('Error updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
