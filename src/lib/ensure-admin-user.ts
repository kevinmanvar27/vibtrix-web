import { UserRole } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'crypto';
import prisma from './prisma';
import debug from './debug';

/**
 * Ensures that the admin user exists in the database
 * This function is called during application startup
 * It checks if the admin user exists, and creates it if it doesn't
 */
export async function ensureAdminUser() {
  try {
    debug.log('Checking for admin user...');
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@rektech.uk' }
        ]
      }
    });

    if (adminUser) {
      debug.log('Admin user exists:', {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      });
      
      // Ensure the admin user has the correct role and credentials
      if (adminUser.role !== UserRole.SUPER_ADMIN || !adminUser.isAdmin) {
        debug.log('Updating admin user role and privileges...');
        
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            role: UserRole.SUPER_ADMIN,
            isAdmin: true,
            isManagementUser: true
          }
        });
        
        debug.log('Admin user updated with correct role and privileges');
      }
      
      return;
    }

    debug.log('Admin user not found, creating...');
    
    // Create the admin user
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
    
    debug.log('Admin user created successfully:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });
  } catch (error) {
    debug.error('Error ensuring admin user exists:', error);
    // Don't throw the error, just log it
    // We don't want to prevent the application from starting
  }
}
