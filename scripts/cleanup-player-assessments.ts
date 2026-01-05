import {
  deleteDnaAssessmentSessionsForPlayer,
  deleteDnaAssessmentSessionsForPlayerInProgram,
} from '@/lib/db/repositories/dnaAssessmentRepository';

/**
 * Utility script for one-off cleanup.
 *
 * Usage:
 *   tsx scripts/cleanup-player-assessments.ts <academyId> <playerId> [programId]
 */
async function main() {
  const academyId = process.argv[2];
  const playerId = process.argv[3];
  const programId = process.argv[4];

  if (!academyId || !playerId) {
    console.error('Missing args. Usage: tsx scripts/cleanup-player-assessments.ts <academyId> <playerId> [programId]');
    process.exit(1);
  }

  const deletedCount = programId
    ? await deleteDnaAssessmentSessionsForPlayerInProgram({ academyId, programId, playerId })
    : await deleteDnaAssessmentSessionsForPlayer({ academyId, playerId });

  console.log(JSON.stringify({ success: true, academyId, playerId, programId: programId || null, deletedCount }));
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
