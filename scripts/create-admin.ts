import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'rektechuk' },
          { email: 'admin@rektech.uk' }
        ]
      }
    });

    console.log('Checking for existing user:', existingUser ? 'Found' : 'Not found');

    if (existingUser) {
      console.log('Admin user already exists. Updating with new credentials...');

      // Update the existing user with the new credentials
      const passwordHash = await hash('RekTech@27', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: 'rektechuk',
          displayName: 'Admin',
          email: 'admin@rektech.uk',
          passwordHash,
          isAdmin: true,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      console.log('Admin user updated successfully!');
      console.log('Username:', updatedUser.username);
      console.log('Email:', updatedUser.email);
      console.log('Password: RekTech@27');
      console.log('isAdmin:', updatedUser.isAdmin);
      console.log('Role:', updatedUser.role);
      return;
    }

    // Create admin user
    const userId = randomUUID();
    const passwordHash = await hash('RekTech@27', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username: 'rektechuk',
        displayName: 'Admin',
        email: 'admin@rektech.uk',
        passwordHash,
        isAdmin: true,
        role: 'SUPER_ADMIN',
        isActive: true,
        onlineStatus: 'ONLINE',
        showOnlineStatus: true,
        isProfilePublic: true,
      }
    });

    console.log('Admin user created successfully!');
    console.log('Username:', newUser.username);
    console.log('Email:', newUser.email);
    console.log('Password: RekTech@27');
    console.log('isAdmin:', newUser.isAdmin);
    console.log('Role:', newUser.role);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
