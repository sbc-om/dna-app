#!/usr/bin/env tsx

/**
 * Reset LMDB database to a minimal state.
 *
 * This script deletes the LMDB files under data/lmdb and recreates ONLY the admin user.
 *
 * Default credentials:
 * - Email: admin@dna.com
 * - Password: admin123
 */

import fs from 'fs';
import path from 'path';
import { closeDatabase } from '../src/lib/db/lmdb';
import { createUser, findUserByEmail, updateUser } from '../src/lib/db/repositories/userRepository';
import { ROLES } from '../src/config/roles';

async function resetDbToAdminOnly() {
	const dbDir = path.join(process.cwd(), 'data', 'lmdb');

	console.log('Resetting LMDB database to admin-only...');
	console.log(`Target directory: ${dbDir}`);

	// Ensure we are not holding open file handles.
	await closeDatabase();

	// Delete the LMDB directory entirely.
	fs.rmSync(dbDir, { recursive: true, force: true });
	fs.mkdirSync(dbDir, { recursive: true });

	// Recreate admin user.
	const existingAdmin = await findUserByEmail('admin@dna.com');
	if (existingAdmin) {
		if (existingAdmin.role !== ROLES.ADMIN) {
			await updateUser(existingAdmin.id, { role: ROLES.ADMIN });
		}
		console.log('Admin user already exists after reset (unexpected but OK).');
	} else {
		await createUser({
			username: 'admin',
			email: 'admin@dna.com',
			password: 'admin123',
			fullName: 'System Administrator',
			role: ROLES.ADMIN,
		});
		console.log('Admin user created.');
	}

	await closeDatabase();

	console.log('\nDone. Database is now empty except the admin user.');
	console.log('Admin credentials:');
	console.log('  Email: admin@dna.com');
	console.log('  Password: admin123');
}

resetDbToAdminOnly()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Failed to reset database:', error);
		process.exit(1);
	});
