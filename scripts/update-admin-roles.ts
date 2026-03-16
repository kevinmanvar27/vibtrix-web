import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting admin role update...');

    // Generate Prisma client first to ensure it has the latest schema
    console.log('Ensuring Prisma client is up to date...');

    // Find all users with isAdmin=true
    const adminUsers = await prisma.user.findMany({
      where: {
        isAdmin: true,
      },
    });

    console.log(`Found ${adminUsers.length} admin users to update`);

    // Update each admin user to have the ADMIN role
    for (const user of adminUsers) {
      // Check if the user's role is USER (default) or not set
      // We need to use type assertion since the role field might not be recognized yet
      const userRole = (user as any).role;

      if (!userRole || userRole === UserRole.USER) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            // Use type assertion to avoid TypeScript errors during migration
            role: UserRole.ADMIN as any
          },
        });
        console.log(`Updated user ${user.username} to have ADMIN role`);
      } else {
        console.log(`User ${user.username} already has a role, skipping`);
      }
    }

    // Set the initial admin user to SUPER_ADMIN
    const superAdmin = await prisma.user.findFirst({
      where: {
        username: 'rektechuk',
      },
    });

    if (superAdmin) {
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: {
          // Use type assertion to avoid TypeScript errors during migration
          role: UserRole.SUPER_ADMIN as any
        },
      });
      console.log(`Updated user ${superAdmin.username} to have SUPER_ADMIN role`);
    } else {
      console.log('Super admin user not found');
    }

    console.log('Admin role update completed successfully');
  } catch (error) {
    console.error('Error updating admin roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
