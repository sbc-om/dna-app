import { createUser, findUserByEmail } from '../db/repositories/userRepository';
import { ROLES } from '@/config/roles';

/**
 * Initialize the database with default data
 * This should be run on first application startup
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Create default admin user (only)
    const existingAdmin = await findUserByEmail('admin@dna.com');
    if (!existingAdmin) {
      await createUser({
        email: 'admin@dna.com',
        username: 'admin',
        password: 'admin123',
        fullName: 'System Administrator',
        role: ROLES.ADMIN,
      });
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists (skipping)');
    }

    console.log('\nDatabase initialized successfully!');
    console.log('\nDefault admin credentials:');
    console.log('  Email: admin@dna.com');
    console.log('  Password: admin123');
    console.log('\n⚠️  Please change the default password after first login!\n');

    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
}

/**
 * Check if database is initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const admin = await findUserByEmail('admin@dna.com');
    return admin !== null;
  } catch {
    return false;
  }
}
