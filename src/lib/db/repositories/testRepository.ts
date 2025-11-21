import { getDatabase, generateId } from '../lmdb';

export interface TestResult {
  id: string;
  userId: string; // The kid
  testName: string;
  stage: string; // e.g., "Initial", "Mid-term", "Final"
  score: number;
  maxScore: number;
  date: string;
  examinerId: string; // The admin/teacher who conducted the test
  notes?: string;
  attachments?: string[]; // URLs to uploaded files
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestResultInput {
  userId: string;
  testName: string;
  stage: string;
  score: number;
  maxScore: number;
  date: string;
  examinerId: string;
  notes?: string;
  attachments?: string[];
}

export interface UpdateTestResultInput {
  testName?: string;
  stage?: string;
  score?: number;
  maxScore?: number;
  date?: string;
  notes?: string;
  attachments?: string[];
}

const TESTS_PREFIX = 'tests:';
const TESTS_BY_USER_PREFIX = 'tests_by_user:';

/**
 * Create a new test result
 */
export async function createTestResult(input: CreateTestResultInput): Promise<TestResult> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  const testResult: TestResult = {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  // Store test result
  await db.put(`${TESTS_PREFIX}${id}`, testResult);
  
  // Index by user (we might have multiple tests per user, so we need a composite key or a list)
  // For LMDB simple key-value, storing a list of IDs for a user is one way, 
  // or using a composite key like `tests_by_user:{userId}:{testId}` is better for range queries.
  await db.put(`${TESTS_BY_USER_PREFIX}${input.userId}:${id}`, id);

  return testResult;
}

/**
 * Get test result by ID
 */
export async function getTestResultById(id: string): Promise<TestResult | null> {
  const db = getDatabase();
  return (await db.get(`${TESTS_PREFIX}${id}`)) || null;
}

/**
 * Get all test results for a user
 */
export async function getTestResultsByUserId(userId: string): Promise<TestResult[]> {
  const db = getDatabase();
  const results: TestResult[] = [];

  for await (const { key, value } of db.getRange({
    start: `${TESTS_BY_USER_PREFIX}${userId}:`,
    end: `${TESTS_BY_USER_PREFIX}${userId}:\xFF`,
  })) {
    const testId = value as string;
    const test = await getTestResultById(testId);
    if (test) {
      results.push(test);
    }
  }

  // Sort by date descending
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Update test result
 */
export async function updateTestResult(id: string, input: UpdateTestResultInput): Promise<TestResult | null> {
  const db = getDatabase();
  const test = await getTestResultById(id);

  if (!test) {
    return null;
  }

  const updatedTest: TestResult = {
    ...test,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await db.put(`${TESTS_PREFIX}${id}`, updatedTest);
  return updatedTest;
}

/**
 * Delete test result
 */
export async function deleteTestResult(id: string): Promise<boolean> {
  const db = getDatabase();
  const test = await getTestResultById(id);

  if (!test) {
    return false;
  }

  await db.remove(`${TESTS_PREFIX}${id}`);
  await db.remove(`${TESTS_BY_USER_PREFIX}${test.userId}:${id}`);

  return true;
}
