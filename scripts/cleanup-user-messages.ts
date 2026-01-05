import { softDeleteMessagesForUser } from '@/lib/db/repositories/messageRepository';

/**
 * Utility script for one-off cleanup.
 *
 * Usage:
 *   tsx scripts/cleanup-user-messages.ts <userId>
 */
async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Missing userId. Usage: tsx scripts/cleanup-user-messages.ts <userId>');
    process.exit(1);
  }

  const deletedCount = await softDeleteMessagesForUser(userId);
  console.log(JSON.stringify({ success: true, userId, deletedCount }));
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
