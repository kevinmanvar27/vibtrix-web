import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Updating admin credentials...');
    
    // Find the existing admin user
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'rektechuk' },
          { email: 'rektech.uk@gmail.com' },
          { username: 'admin' },
          { email: 'admin@rektech.uk' }
        ]
      }
    });

    // Hash the password
    const passwordHash = await hash('RekTech@27', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (existingAdmin) {
      console.log(`Found existing admin user with ID: ${existingAdmin.id}`);
      
      // Update the existing admin user with new credentials
      const updatedUser = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          username: 'admin',
          displayName: 'Admin',
          email: 'admin@rektech.uk',
          passwordHash,
          isAdmin: true,
          role: UserRole.SUPER_ADMIN,
        }
      });

      console.log('Admin credentials updated successfully!');
      console.log(`Username: ${updatedUser.username}`);
      console.log(`Email: ${updatedUser.email}`);
      console.log(`Role: ${updatedUser.role}`);
      console.log('Password has been set to: RekTech@27');
    } else {
      // Create a new admin user if none exists
      const userId = randomUUID();
      
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          username: 'admin',
          displayName: 'Admin',
          email: 'admin@rektech.uk',
          passwordHash,
          isAdmin: true,
          role: UserRole.SUPER_ADMIN,
        }
      });

      console.log('New admin user created successfully!');
      console.log(`Username: ${newUser.username}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Role: ${newUser.role}`);
      console.log('Password: RekTech@27');
    }
  } catch (error) {
    console.error('Error updating admin credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
