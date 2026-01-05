import { removeProgramEnrollment } from '@/lib/db/repositories/programEnrollmentRepository';
import { deleteProgramAttendanceForUserInProgram } from '@/lib/db/repositories/programAttendanceRepository';

/**
 * Utility script for one-off cleanup.
 *
 * Removes a player from a program and deletes all related per-program data
 * currently stored in LMDB (enrollment + attendance records).
 *
 * Usage:
 *   tsx scripts/remove-player-from-program.ts <academyId> <programId> <userId>
 */
async function main() {
  const academyId = process.argv[2];
  const programId = process.argv[3];
  const userId = process.argv[4];

  if (!academyId || !programId || !userId) {
    console.error('Usage: tsx scripts/remove-player-from-program.ts <academyId> <programId> <userId>');
    process.exit(1);
  }

  const attendanceDeleted = await deleteProgramAttendanceForUserInProgram({ academyId, programId, userId });
  const enrollmentDeleted = await removeProgramEnrollment({ academyId, programId, userId });

  console.log(
    JSON.stringify(
      {
        success: true,
        academyId,
        programId,
        userId,
        enrollmentDeleted,
        attendanceDeleted,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
