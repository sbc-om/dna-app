import { getDatabase } from '../src/lib/db/lmdb';

async function main() {
  const db = getDatabase();
  const USERS_PREFIX = 'users:';

  console.log('\n📋 Listing all users in database:\n');

  const allUsers: any[] = [];
  for await (const { key, value } of db.getRange({ start: USERS_PREFIX, end: USERS_PREFIX + '\uffff' })) {
    if (typeof key === 'string' && key.startsWith(USERS_PREFIX)) {
      allUsers.push(value);
    }
  }

  if (allUsers.length === 0) {
    console.log('❌ No users found in database!');
    console.log('\nRun this to create admin: npm run create-admin');
  } else {
    console.log(`Found ${allUsers.length} users:\n`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Full Name: ${user.fullName || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Profile Picture: ${user.profilePicture || 'None'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
