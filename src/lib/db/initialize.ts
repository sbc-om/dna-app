import { createUser, findUserByEmail } from '../db/repositories/userRepository';
import { ROLES } from '@/config/roles';

/**
 * Initialize the database with default data
 * This should be run on first application startup
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Create default admin user
    const adminUser = await createUser({
      email: 'admin@dna.com',
      username: 'admin',
      password: 'admin123',
      fullName: 'System Administrator',
      role: ROLES.ADMIN,
    });
    console.log('✓ Admin user created');

    // Create sample coach
    const coachUser = await createUser({
      email: 'coach@dna.com',
      username: 'coach',
      password: 'coach123',
      fullName: 'Coach User',
      role: ROLES.COACH,
    });
    console.log('✓ Coach user created');

    // Create sample parent
    const parentUser = await createUser({
      email: 'parent@dna.com',
      username: 'parent',
      password: 'parent123',
      fullName: 'Parent User',
      role: ROLES.PARENT,
    });
    console.log('✓ Parent user created');

    // Create sample kid
    const kidUser = await createUser({
      email: 'kid@dna.com',
      username: 'kid',
      password: 'kid123',
      fullName: 'Kid User',
      role: ROLES.KID,
    });
    console.log('✓ Kid user created');

    console.log('\nDatabase initialized successfully!');
    console.log('\nDefault user credentials:');
    console.log('\n  Admin:');
    console.log('    Email: admin@dna.com');
    console.log('    Password: admin123');
    console.log('\n  Coach:');
    console.log('    Email: coach@dna.com');
    console.log('    Password: coach123');
    console.log('\n  Parent:');
    console.log('    Email: parent@dna.com');
    console.log('    Password: parent123');
    console.log('\n  Kid:');
    console.log('    Email: kid@dna.com');
    console.log('    Password: kid123');
    console.log('\n⚠️  Please change the default passwords after first login!\n');

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
