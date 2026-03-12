import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Updating admin user credentials...\n');
  
  // Hash the new password
  const password = 'RekTech@27';
  console.log(`Hashing password: ${password}`);
  
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  
  console.log('✅ Password hashed successfully\n');
  
  // Update the admin user
  const updatedUser = await prisma.user.update({
    where: { username: 'admin' },
    data: {
      email: 'admin@rektech.uk',
      passwordHash,
      displayName: 'Admin User',
    },
  });
  
  console.log('✅ Admin user updated successfully!\n');
  console.log('📋 New Credentials:');
  console.log(`   Username: admin`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n💡 You can now login with:`);
  console.log(`   - Username: admin`);
  console.log(`   - Email: admin@rektech.uk`);
  console.log(`   - Password: RekTech@27`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
