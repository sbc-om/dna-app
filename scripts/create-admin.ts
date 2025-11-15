#!/usr/bin/env ts-node

/**
 * Create Default Admin User Script
 * 
 * This script creates a default admin user in the LMDB database
 * with full permissions to access the dashboard.
 * 
 * Usage: npm run create-admin
 */

import { createUser, findUserByEmail } from '../src/lib/db/repositories/userRepository';
import { createRole, findRoleByName } from '../src/lib/db/repositories/roleRepository';
import { createPermission } from '../src/lib/db/repositories/permissionRepository';
import { registerResource } from '../src/lib/db/repositories/resourceRepository';
import type { PermissionAction } from '../src/lib/access-control/permissions';

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...\n');

  try {
    // Check if admin user already exists
    const existingAdmin = await findUserByEmail('admin@dna.com');
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@dna.com');
      console.log('� Updating permissions...\n');
      // Continue to update permissions
    }

    // Register default resources
    console.log('📝 Registering default resources...');
    
    await registerResource({
      key: 'dashboard',
      type: 'page',
      displayNameKey: 'resources.dashboard',
      defaultActions: ['read', 'write', 'manage'],
    });

    await registerResource({
      key: 'dashboard.users',
      type: 'module',
      displayNameKey: 'resources.users',
      defaultActions: ['read', 'write', 'manage', 'create', 'delete'],
    });

    await registerResource({
      key: 'dashboard.roles',
      type: 'module',
      displayNameKey: 'resources.roles',
      defaultActions: ['read', 'write', 'manage', 'create', 'delete'],
    });

    await registerResource({
      key: 'dashboard.resources',
      type: 'module',
      displayNameKey: 'resources.resources',
      defaultActions: ['read', 'write', 'manage'],
    });

    await registerResource({
      key: 'dashboard.permissions',
      type: 'module',
      displayNameKey: 'resources.permissions',
      defaultActions: ['read', 'write', 'manage'],
    });

    console.log('✅ Resources registered\n');

    // Create or find admin role
    console.log('👥 Creating admin role...');
    
    let adminRole = await findRoleByName('admin');
    
    if (!adminRole) {
      adminRole = await createRole({
        name: 'admin',
        description: 'System Administrator with full access',
        permissionIds: [],
      });
      console.log('✅ Admin role created');
    } else {
      console.log('✅ Admin role already exists');
    }

    // Create permissions for admin role
    console.log('🔐 Creating permissions...');
    
    const resources = [
      'dashboard',
      'dashboard.users',
      'dashboard.roles',
      'dashboard.resources',
      'dashboard.permissions',
    ];

    const actions: PermissionAction[] = ['read', 'write', 'manage', 'create', 'delete'];

    const permissionIds: string[] = [];
    
    for (const resourceKey of resources) {
      for (const action of actions) {
        const permission = await createPermission({
          resourceKey,
          resourceType: resourceKey === 'dashboard' ? 'page' : 'module',
          action,
        });
        permissionIds.push(permission.id);
      }
    }

    console.log('✅ Permissions created\n');

    // Create or update admin user
    console.log('👤 Creating/updating admin user...');
    
    const existingAdmin2 = await findUserByEmail('admin@dna.com');
    
    let adminUser;
    if (existingAdmin2) {
      // Update existing admin user with new permissions
      const { updateUser } = await import('../src/lib/db/repositories/userRepository');
      adminUser = await updateUser(existingAdmin2.id, {
        directPermissions: permissionIds,
      });
      console.log('✅ Admin user permissions updated!\n');
    } else {
      adminUser = await createUser({
        username: 'admin',
        email: 'admin@dna.com',
        password: 'admin123', // Will be hashed by createUser function
        fullName: 'System Administrator',
        phoneNumber: '+966 777 22 11 2',
        groupIds: [],
        directPermissions: permissionIds,
      });
      console.log('✅ Admin user created successfully!\n');
    }
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    admin@dna.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name:     System Administrator');
    console.log('═══════════════════════════════════════\n');
    console.log('🎉 You can now login to the dashboard!\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
