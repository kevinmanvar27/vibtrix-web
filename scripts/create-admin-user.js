const { PrismaClient, UserRole } = require('@prisma/client');
const { hash } = require('@node-rs/argon2');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@rektech.uk' }
        ]
      }
    });

    if (existingUser) {
      console.log('Admin user already exists. Updating credentials...');
      
      // Hash the password
      const passwordHash = await hash('RekTech@27', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
      
      // Update the existing user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: 'admin',
          displayName: 'Admin',
          email: 'admin@rektech.uk',
          passwordHash,
          isAdmin: true,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        }
      });
      
      console.log('Admin user updated successfully!');
      console.log('Username:', updatedUser.username);
      console.log('Email:', updatedUser.email);
      console.log('Role:', updatedUser.role);
      console.log('Password: RekTech@27');
    } else {
      // Create a new admin user
      const passwordHash = await hash('RekTech@27', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
      
      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: 'admin',
          displayName: 'Admin',
          email: 'admin@rektech.uk',
          passwordHash,
          isAdmin: true,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          isManagementUser: true,
        }
      });
      
      console.log('Admin user created successfully!');
      console.log('Username:', newUser.username);
      console.log('Email:', newUser.email);
      console.log('Role:', newUser.role);
      console.log('Password: RekTech@27');
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
