#!/usr/bin/env tsx

/**
 * Create Default Admin User Script
 * Simple script to create admin user with the new role system
 */

import { createUser, findUserByEmail, updateUser } from '../src/lib/db/repositories/userRepository';
import { ROLES } from '../src/config/roles';

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...\n');

  try {
    const existingAdmin = await findUserByEmail('admin@dna.com');
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@dna.com');
      
      // Update to admin role if not already
      if (existingAdmin.role !== ROLES.ADMIN) {
        await updateUser(existingAdmin.id, {
          role: ROLES.ADMIN,
        });
        console.log('✅ User updated to admin role!');
      } else {
        console.log('✅ User is already an admin!');
      }
    } else {
      // Create new admin user
      const adminUser = await createUser({
        username: 'admin',
        email: 'admin@dna.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: ROLES.ADMIN,
      });
      
      console.log('✅ Admin user created successfully!\n');
      console.log('📧 Email: admin@dna.com');
      console.log('🔑 Password: admin123');
      console.log('\n⚠️  Please change the default password after first login!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
