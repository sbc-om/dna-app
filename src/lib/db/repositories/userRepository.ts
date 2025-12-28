import { getDatabase, generateId } from '../lmdb';
import bcrypt from 'bcryptjs';
import { UserRole, ROLES } from '@/config/roles';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  phoneNumber?: string;
  nationalId?: string; // For kids (children)
  profilePicture?: string; // Profile image URL
  role: UserRole;
  parentId?: string; // For kids - reference to parent user

  /**
   * Parent contact details for kid accounts.
   *
   * DNA onboarding uses a single player account, with the parent linked as contact data (no separate parent user required).
   * Legacy flows may still use parentId.
   */
  parentContactName?: string;
  parentContactEmail?: string;
  parentContactPhone?: string;

  /**
   * DNA activation state for the player.
   * - pending_activation: created by academy, awaiting parent confirmation/payment
   * - active_awaiting_assessment: paid/activated, waiting for Discover assessment
   * - active: assessment completed and profile is fully available
   */
  dnaActivationStatus?: 'pending_activation' | 'active_awaiting_assessment' | 'active';
  dnaActivatedAt?: string;
  
  // Extended Profile for Kids
  birthDate?: string;
  ageYears?: number; // cached at registration time; optional
  gender?: 'male' | 'female';
  address?: string;
  school?: string;
  grade?: string;
  medicalInfo?: string;
  
  // Player Card Fields
  position?: string; // e.g., "Forward", "Midfielder", "Defender", "Goalkeeper"
  preferredFoot?: 'left' | 'right' | 'both';
  height?: number; // cm
  weight?: number; // kg
  country?: string; // ISO country code or name
  dnaStage?: string; // e.g., "Bronze", "Silver", "Gold", "Platinum"
  
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  nationalId?: string;
  role?: UserRole;
  parentId?: string;

  parentContactName?: string;
  parentContactEmail?: string;
  parentContactPhone?: string;
  dnaActivationStatus?: User['dnaActivationStatus'];
  dnaActivatedAt?: string;
  
  birthDate?: string;
  ageYears?: number;
  gender?: 'male' | 'female';
  address?: string;
  school?: string;
  grade?: string;
  medicalInfo?: string;
  
  position?: string;
  preferredFoot?: 'left' | 'right' | 'both';
  height?: number;
  weight?: number;
  country?: string;
  dnaStage?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  phoneNumber?: string;
  nationalId?: string;
  profilePicture?: string;
  role?: UserRole;
  isActive?: boolean;
  parentId?: string;

  parentContactName?: string;
  parentContactEmail?: string;
  parentContactPhone?: string;
  dnaActivationStatus?: User['dnaActivationStatus'];
  dnaActivatedAt?: string;
  
  birthDate?: string;
  ageYears?: number;
  gender?: 'male' | 'female';
  address?: string;
  school?: string;
  grade?: string;
  medicalInfo?: string;
  
  position?: string;
  preferredFoot?: 'left' | 'right' | 'both';
  height?: number;
  weight?: number;
  country?: string;
  dnaStage?: string;
}

const USERS_PREFIX = 'users:';
const USERS_BY_EMAIL_PREFIX = 'users_by_email:';
const USERS_BY_USERNAME_PREFIX = 'users_by_username:';

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const db = getDatabase();
  
  // Check if email or username already exists
  const existingByEmail = await findUserByEmail(input.email);
  if (existingByEmail) {
    throw new Error('User with this email already exists');
  }

  const existingByUsername = await findUserByUsername(input.username);
  if (existingByUsername) {
    throw new Error('User with this username already exists');
  }

  const id = generateId();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);

  const user: User = {
    id,
    email: input.email.toLowerCase(),
    username: input.username,
    passwordHash,
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    nationalId: input.nationalId,
    role: input.role || ROLES.PLAYER,
    parentId: input.parentId,

    parentContactName: input.parentContactName,
    parentContactEmail: input.parentContactEmail,
    parentContactPhone: input.parentContactPhone,
    dnaActivationStatus: input.dnaActivationStatus,
    dnaActivatedAt: input.dnaActivatedAt,
    
    birthDate: input.birthDate,
    ageYears: input.ageYears,
    gender: input.gender,
    address: input.address,
    school: input.school,
    grade: input.grade,
    medicalInfo: input.medicalInfo,
    
    position: input.position,
    preferredFoot: input.preferredFoot,
    height: input.height,
    weight: input.weight,
    country: input.country,
    dnaStage: input.dnaStage,

    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  // Store user by ID
  await db.put(`${USERS_PREFIX}${id}`, user);
  
  // Create email index
  await db.put(`${USERS_BY_EMAIL_PREFIX}${user.email}`, id);
  
  // Create username index
  await db.put(`${USERS_BY_USERNAME_PREFIX}${user.username}`, id);

  return user;
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const db = getDatabase();
  const user = await db.get(`${USERS_PREFIX}${id}`);
  return user || null;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase();
  const userId = await db.get(`${USERS_BY_EMAIL_PREFIX}${email.toLowerCase()}`);
  
  if (!userId) {
    return null;
  }

  return findUserById(userId);
}

/**
 * Find user by username
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDatabase();
  const userId = await db.get(`${USERS_BY_USERNAME_PREFIX}${username}`);
  
  if (!userId) {
    return null;
  }

  return findUserById(userId);
}

/**
 * Update user by ID
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const db = getDatabase();
  const user = await findUserById(id);

  if (!user) {
    return null;
  }

  // Check if email is being changed and if new email exists
  if (input.email && input.email !== user.email) {
    const existingByEmail = await findUserByEmail(input.email);
    if (existingByEmail && existingByEmail.id !== id) {
      throw new Error('User with this email already exists');
    }
    
    // Remove old email index
    await db.remove(`${USERS_BY_EMAIL_PREFIX}${user.email}`);
  }

  // Check if username is being changed and if new username exists
  if (input.username && input.username !== user.username) {
    const existingByUsername = await findUserByUsername(input.username);
    if (existingByUsername && existingByUsername.id !== id) {
      throw new Error('User with this username already exists');
    }
    
    // Remove old username index
    await db.remove(`${USERS_BY_USERNAME_PREFIX}${user.username}`);
  }

  const updatedUser: User = {
    ...user,
    email: input.email?.toLowerCase() || user.email,
    username: input.username || user.username,
    passwordHash: input.password ? await hashPassword(input.password) : user.passwordHash,
    fullName: input.fullName !== undefined ? input.fullName : user.fullName,
    phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : user.phoneNumber,
    nationalId: input.nationalId !== undefined ? input.nationalId : user.nationalId,
    profilePicture: input.profilePicture !== undefined ? input.profilePicture : user.profilePicture,
    role: input.role !== undefined ? input.role : user.role,
    parentId: input.parentId !== undefined ? input.parentId : user.parentId,
    isActive: input.isActive !== undefined ? input.isActive : user.isActive,

    parentContactName: input.parentContactName !== undefined ? input.parentContactName : user.parentContactName,
    parentContactEmail: input.parentContactEmail !== undefined ? input.parentContactEmail : user.parentContactEmail,
    parentContactPhone: input.parentContactPhone !== undefined ? input.parentContactPhone : user.parentContactPhone,
    dnaActivationStatus: input.dnaActivationStatus !== undefined ? input.dnaActivationStatus : user.dnaActivationStatus,
    dnaActivatedAt: input.dnaActivatedAt !== undefined ? input.dnaActivatedAt : user.dnaActivatedAt,
    
    birthDate: input.birthDate !== undefined ? input.birthDate : user.birthDate,
    ageYears: input.ageYears !== undefined ? input.ageYears : user.ageYears,
    gender: input.gender !== undefined ? input.gender : user.gender,
    address: input.address !== undefined ? input.address : user.address,
    school: input.school !== undefined ? input.school : user.school,
    grade: input.grade !== undefined ? input.grade : user.grade,
    medicalInfo: input.medicalInfo !== undefined ? input.medicalInfo : user.medicalInfo,
    
    position: input.position !== undefined ? input.position : user.position,
    preferredFoot: input.preferredFoot !== undefined ? input.preferredFoot : user.preferredFoot,
    height: input.height !== undefined ? input.height : user.height,
    weight: input.weight !== undefined ? input.weight : user.weight,
    country: input.country !== undefined ? input.country : user.country,
    dnaStage: input.dnaStage !== undefined ? input.dnaStage : user.dnaStage,

    updatedAt: new Date().toISOString(),
  };

  // Update user by ID
  await db.put(`${USERS_PREFIX}${id}`, updatedUser);
  
  // Update email index if changed
  if (input.email && input.email !== user.email) {
    await db.put(`${USERS_BY_EMAIL_PREFIX}${updatedUser.email}`, id);
  }
  
  // Update username index if changed
  if (input.username && input.username !== user.username) {
    await db.put(`${USERS_BY_USERNAME_PREFIX}${updatedUser.username}`, id);
  }

  return updatedUser;
}

/**
 * Delete user by ID
 */
export async function deleteUser(id: string): Promise<boolean> {
  const db = getDatabase();
  const user = await findUserById(id);

  if (!user) {
    return false;
  }

  // Remove user
  await db.remove(`${USERS_PREFIX}${id}`);
  
  // Remove email index
  await db.remove(`${USERS_BY_EMAIL_PREFIX}${user.email}`);
  
  // Remove username index
  await db.remove(`${USERS_BY_USERNAME_PREFIX}${user.username}`);

  return true;
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  const db = getDatabase();
  const users: User[] = [];

  for await (const { key, value } of db.getRange({
    start: USERS_PREFIX,
    end: `${USERS_PREFIX}\xFF`,
  })) {
    const keyStr = String(key);
    if (keyStr.startsWith(USERS_PREFIX)) {
      users.push(value as User);
    }
  }

  return users;
}

// Get all coaches
export async function getCoaches(): Promise<User[]> {
  const allUsers = await listUsers();
  return allUsers.filter(user => user.role === 'coach' && user.isActive);
}

/**
 * Fetch multiple users by their IDs
 */
export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const idSet = new Set(ids);
  const allUsers = await listUsers();
  return allUsers.filter(user => idSet.has(user.id));
}

/**
 * Get all users (alias for listUsers for consistency)
 */
export async function getAllUsers(): Promise<User[]> {
  return listUsers();
}

/**
 * Get children (kids) by parent ID
 */
export async function getChildrenByParentId(parentId: string): Promise<User[]> {
  const allUsers = await listUsers();
  return allUsers.filter(user => user.parentId === parentId && user.role === ROLES.PLAYER);
}
