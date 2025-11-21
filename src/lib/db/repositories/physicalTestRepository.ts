import { getDatabase, generateId } from '../lmdb';

/**
 * Physical Test Results for Player Card Generation
 */
export interface PhysicalTest {
  id: string;
  userId: string; // The kid/player
  
  // Physical Test Data
  verticalJump?: number; // cm
  broadJump?: number; // cm
  sprint10m?: number; // seconds
  sprint20m?: number; // seconds
  sprint30m?: number; // seconds
  illinoisAgilityTest?: number; // seconds
  tTest?: number; // seconds
  agility505Test?: number; // seconds
  singleLegBalance?: number; // seconds
  plankHold?: number; // seconds
  enduranceTest?: number; // distance in meters (Yo-Yo/Cooper)
  pullUpTest?: number; // count
  
  // Test Metadata
  testDate: string;
  examinerId: string; // Admin who conducted the test
  notes?: string;
  
  // Calculated Ratings (1-99)
  speedRating?: number;
  agilityRating?: number;
  physicalStrengthRating?: number;
  upperBodyStrengthRating?: number;
  motorControlRating?: number;
  enduranceRating?: number;
  overallRating?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhysicalTestInput {
  userId: string;
  verticalJump?: number;
  broadJump?: number;
  sprint10m?: number;
  sprint20m?: number;
  sprint30m?: number;
  illinoisAgilityTest?: number;
  tTest?: number;
  agility505Test?: number;
  singleLegBalance?: number;
  plankHold?: number;
  enduranceTest?: number;
  pullUpTest?: number;
  testDate: string;
  examinerId: string;
  notes?: string;
}

export interface UpdatePhysicalTestInput {
  verticalJump?: number;
  broadJump?: number;
  sprint10m?: number;
  sprint20m?: number;
  sprint30m?: number;
  illinoisAgilityTest?: number;
  tTest?: number;
  agility505Test?: number;
  singleLegBalance?: number;
  plankHold?: number;
  enduranceTest?: number;
  pullUpTest?: number;
  testDate?: string;
  notes?: string;
}

const PHYSICAL_TESTS_PREFIX = 'physical_tests:';
const PHYSICAL_TESTS_BY_USER_PREFIX = 'physical_tests_by_user:';

/**
 * Calculate ratings from raw test data
 */
function calculateRatings(test: PhysicalTest): PhysicalTest {
  // Speed Rating (based on sprint times - lower is better)
  let speedScore = 0;
  let speedCount = 0;
  
  if (test.sprint10m) {
    speedScore += Math.max(1, Math.min(99, 99 - (test.sprint10m - 1.5) * 50));
    speedCount++;
  }
  if (test.sprint20m) {
    speedScore += Math.max(1, Math.min(99, 99 - (test.sprint20m - 3.0) * 30));
    speedCount++;
  }
  if (test.sprint30m) {
    speedScore += Math.max(1, Math.min(99, 99 - (test.sprint30m - 4.5) * 20));
    speedCount++;
  }
  
  test.speedRating = speedCount > 0 ? Math.round(speedScore / speedCount) : undefined;
  
  // Agility Rating (based on agility tests - lower time is better)
  let agilityScore = 0;
  let agilityCount = 0;
  
  if (test.illinoisAgilityTest) {
    agilityScore += Math.max(1, Math.min(99, 99 - (test.illinoisAgilityTest - 14) * 10));
    agilityCount++;
  }
  if (test.tTest) {
    agilityScore += Math.max(1, Math.min(99, 99 - (test.tTest - 9) * 10));
    agilityCount++;
  }
  if (test.agility505Test) {
    agilityScore += Math.max(1, Math.min(99, 99 - (test.agility505Test - 2.5) * 40));
    agilityCount++;
  }
  
  test.agilityRating = agilityCount > 0 ? Math.round(agilityScore / agilityCount) : undefined;
  
  // Physical Strength Rating (based on jumps - higher is better)
  let physicalScore = 0;
  let physicalCount = 0;
  
  if (test.verticalJump) {
    physicalScore += Math.max(1, Math.min(99, (test.verticalJump / 60) * 99));
    physicalCount++;
  }
  if (test.broadJump) {
    physicalScore += Math.max(1, Math.min(99, (test.broadJump / 250) * 99));
    physicalCount++;
  }
  
  test.physicalStrengthRating = physicalCount > 0 ? Math.round(physicalScore / physicalCount) : undefined;
  
  // Upper Body Strength Rating (pull-ups)
  if (test.pullUpTest !== undefined) {
    test.upperBodyStrengthRating = Math.max(1, Math.min(99, (test.pullUpTest / 20) * 99));
  }
  
  // Motor Control Rating (balance and plank)
  let motorScore = 0;
  let motorCount = 0;
  
  if (test.singleLegBalance) {
    motorScore += Math.max(1, Math.min(99, (test.singleLegBalance / 60) * 99));
    motorCount++;
  }
  if (test.plankHold) {
    motorScore += Math.max(1, Math.min(99, (test.plankHold / 120) * 99));
    motorCount++;
  }
  
  test.motorControlRating = motorCount > 0 ? Math.round(motorScore / motorCount) : undefined;
  
  // Endurance Rating
  if (test.enduranceTest) {
    test.enduranceRating = Math.max(1, Math.min(99, (test.enduranceTest / 3000) * 99));
  }
  
  // Overall Rating (average of all available ratings)
  const allRatings = [
    test.speedRating,
    test.agilityRating,
    test.physicalStrengthRating,
    test.upperBodyStrengthRating,
    test.motorControlRating,
    test.enduranceRating,
  ].filter(r => r !== undefined) as number[];
  
  if (allRatings.length > 0) {
    test.overallRating = Math.round(
      allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
    );
  }
  
  return test;
}

/**
 * Create a new physical test
 */
export async function createPhysicalTest(input: CreatePhysicalTestInput): Promise<PhysicalTest> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  let test: PhysicalTest = {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  // Calculate ratings
  test = calculateRatings(test);

  // Store test
  await db.put(`${PHYSICAL_TESTS_PREFIX}${id}`, test);
  
  // Index by user
  await db.put(`${PHYSICAL_TESTS_BY_USER_PREFIX}${input.userId}:${id}`, id);

  return test;
}

/**
 * Get physical test by ID
 */
export async function getPhysicalTestById(id: string): Promise<PhysicalTest | null> {
  const db = getDatabase();
  return (await db.get(`${PHYSICAL_TESTS_PREFIX}${id}`)) || null;
}

/**
 * Get all physical tests for a user
 */
export async function getPhysicalTestsByUserId(userId: string): Promise<PhysicalTest[]> {
  const db = getDatabase();
  const results: PhysicalTest[] = [];

  for await (const { value } of db.getRange({
    start: `${PHYSICAL_TESTS_BY_USER_PREFIX}${userId}:`,
    end: `${PHYSICAL_TESTS_BY_USER_PREFIX}${userId}:\xFF`,
  })) {
    const testId = value as string;
    const test = await getPhysicalTestById(testId);
    if (test) {
      results.push(test);
    }
  }

  // Sort by date descending
  return results.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
}

/**
 * Get latest physical test for a user
 */
export async function getLatestPhysicalTest(userId: string): Promise<PhysicalTest | null> {
  const tests = await getPhysicalTestsByUserId(userId);
  return tests.length > 0 ? tests[0] : null;
}

/**
 * Update physical test
 */
export async function updatePhysicalTest(id: string, input: UpdatePhysicalTestInput): Promise<PhysicalTest | null> {
  const db = getDatabase();
  let test = await getPhysicalTestById(id);

  if (!test) {
    return null;
  }

  test = {
    ...test,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate ratings
  test = calculateRatings(test);

  await db.put(`${PHYSICAL_TESTS_PREFIX}${id}`, test);
  return test;
}

/**
 * Delete physical test
 */
export async function deletePhysicalTest(id: string): Promise<boolean> {
  const db = getDatabase();
  const test = await getPhysicalTestById(id);

  if (!test) {
    return false;
  }

  await db.remove(`${PHYSICAL_TESTS_PREFIX}${id}`);
  await db.remove(`${PHYSICAL_TESTS_BY_USER_PREFIX}${test.userId}:${id}`);

  return true;
}
