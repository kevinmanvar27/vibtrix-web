import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating default permissions...');

    // Define default permissions
    const defaultPermissions = [
      { name: "view_users", description: "View user list and details" },
      { name: "edit_users", description: "Edit user information" },
      { name: "delete_users", description: "Delete users" },
      { name: "view_posts", description: "View posts" },
      { name: "edit_posts", description: "Edit posts" },
      { name: "delete_posts", description: "Delete posts" },
      { name: "view_competitions", description: "View competitions" },
      { name: "edit_competitions", description: "Edit competitions" },
      { name: "create_competitions", description: "Create new competitions" },
      { name: "delete_competitions", description: "Delete competitions" },
      { name: "view_pages", description: "View content pages" },
      { name: "edit_pages", description: "Edit content pages" },
      { name: "create_pages", description: "Create new content pages" },
      { name: "delete_pages", description: "Delete content pages" },
      { name: "manage_settings", description: "Manage site settings" },
      { name: "view_payments", description: "View payment information" },
      { name: "process_refunds", description: "Process payment refunds" },
    ];

    // Create permissions
    for (const permission of defaultPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: {
          id: randomUUID(),
          name: permission.name,
          description: permission.description,
        },
      });
    }

    console.log(`Created ${defaultPermissions.length} permissions`);

    // Check if we need to create a test manager user
    const existingManager = await prisma.user.findFirst({
      where: {
        username: 'manager',
        role: UserRole.MANAGER,
      },
    });

    if (!existingManager) {
      console.log('Creating test manager user...');

      // Create a manager user
      const passwordHash = await hash('manager123', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      const managerUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: 'manager',
          displayName: 'Test Manager',
          email: 'manager@example.com',
          passwordHash,
          isAdmin: true,
          isManagementUser: true,
          role: UserRole.MANAGER,
          isActive: true,
        },
      });

      console.log(`Created manager user with ID: ${managerUser.id}`);

      // Get permissions for manager
      const managerPermissions = await prisma.permission.findMany({
        where: {
          name: {
            in: [
              'view_posts',
              'edit_posts',
              'delete_posts',
              'view_competitions',
              'edit_competitions',
              'create_competitions',
              'view_pages',
              'edit_pages',
              'create_pages',
            ],
          },
        },
      });

      // Assign permissions to manager
      for (const permission of managerPermissions) {
        await prisma.userPermission.create({
          data: {
            id: randomUUID(),
            userId: managerUser.id,
            permissionId: permission.id,
          },
        });
      }

      console.log(`Assigned ${managerPermissions.length} permissions to manager user`);
    } else {
      console.log('Manager user already exists, skipping creation');
    }

    // Check if we need to create a test admin user
    const existingAdmin = await prisma.user.findFirst({
      where: {
        username: 'admin',
        role: UserRole.ADMIN,
      },
    });

    if (!existingAdmin) {
      console.log('Creating test admin user...');

      // Create an admin user
      const passwordHash = await hash('admin123', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      const adminUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: 'admin',
          displayName: 'Test Admin',
          email: 'admin@example.com',
          passwordHash,
          isAdmin: true,
          isManagementUser: true,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      console.log(`Created admin user with ID: ${adminUser.id}`);

      // Get permissions for admin
      const adminPermissions = await prisma.permission.findMany({
        where: {
          name: {
            in: [
              'view_users',
              'edit_users',
              'view_posts',
              'edit_posts',
              'delete_posts',
              'view_competitions',
              'edit_competitions',
              'view_pages',
              'edit_pages',
            ],
          },
        },
      });

      // Assign permissions to admin
      for (const permission of adminPermissions) {
        await prisma.userPermission.create({
          data: {
            id: randomUUID(),
            userId: adminUser.id,
            permissionId: permission.id,
          },
        });
      }

      console.log(`Assigned ${adminPermissions.length} permissions to admin user`);
    } else {
      console.log('Admin user already exists, skipping creation');
    }

    // Update the super admin user to have isManagementUser=true
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.SUPER_ADMIN,
      },
    });

    if (superAdmin) {
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: { isManagementUser: true },
      });
      console.log(`Updated super admin user ${superAdmin.username} to have isManagementUser=true`);
    }

    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
