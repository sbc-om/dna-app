import { getDatabase, generateId } from '../lmdb';

export interface SessionPlan {
  id: string;
  courseId: string;
  sessionNumber: number;
  sessionDate: string; // ISO date string
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  objectives: string[]; // Learning objectives
  objectivesAr: string[];
  activities: SessionActivity[];
  materials?: string[]; // Required materials
  materialsAr?: string[];
  notes?: string;
  notesAr?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface SessionActivity {
  id: string;
  name: string;
  nameAr: string;
  duration: number; // in minutes
  description?: string;
  descriptionAr?: string;
  type: 'warmup' | 'drill' | 'game' | 'cooldown' | 'theory';
}

export interface CreateSessionPlanInput {
  courseId: string;
  sessionNumber: number;
  sessionDate: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  objectives: string[];
  objectivesAr: string[];
  activities: Omit<SessionActivity, 'id'>[];
  materials?: string[];
  materialsAr?: string[];
  notes?: string;
  notesAr?: string;
}

// Get all session plans for a course
export function getSessionPlansByCourseId(courseId: string): SessionPlan[] {
  const db = getDatabase();
  const plans: SessionPlan[] = [];
  
  const range = db.getRange({ start: `sessionPlan:${courseId}:`, end: `sessionPlan:${courseId}:\xFF` });
  for (const { value } of range) {
    if (value) plans.push(value);
  }
  
  return plans.sort((a, b) => a.sessionNumber - b.sessionNumber);
}

// Get session plan by ID
export function getSessionPlanById(id: string): SessionPlan | null {
  const db = getDatabase();
  return db.get(`sessionPlan:id:${id}`) || null;
}

// Get session plan by course and session number
export function getSessionPlanByNumber(courseId: string, sessionNumber: number): SessionPlan | null {
  const plans = getSessionPlansByCourseId(courseId);
  return plans.find(p => p.sessionNumber === sessionNumber) || null;
}

// Get session plan by date
export function getSessionPlanByDate(courseId: string, date: string): SessionPlan | null {
  const plans = getSessionPlansByCourseId(courseId);
  return plans.find(p => p.sessionDate === date) || null;
}

// Create session plan
export function createSessionPlan(input: CreateSessionPlanInput): SessionPlan {
  const db = getDatabase();
  const id = generateId();
  
  const sessionPlan: SessionPlan = {
    id,
    ...input,
    activities: input.activities.map(activity => ({
      ...activity,
      id: generateId(),
    })),
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`sessionPlan:${input.courseId}:${sessionPlan.sessionNumber}`, sessionPlan);
  db.put(`sessionPlan:id:${id}`, sessionPlan);
  
  return sessionPlan;
}

// Update session plan
export function updateSessionPlan(id: string, updates: Partial<Omit<SessionPlan, 'id' | 'createdAt'>>): SessionPlan | null {
  const db = getDatabase();
  const existing = getSessionPlanById(id);
  
  if (!existing) return null;
  
  const updated: SessionPlan = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`sessionPlan:${existing.courseId}:${existing.sessionNumber}`, updated);
  db.put(`sessionPlan:id:${id}`, updated);
  
  return updated;
}

// Delete session plan
export function deleteSessionPlan(id: string): boolean {
  const db = getDatabase();
  const existing = getSessionPlanById(id);
  
  if (!existing) return false;
  
  db.remove(`sessionPlan:${existing.courseId}:${existing.sessionNumber}`);
  db.remove(`sessionPlan:id:${id}`);
  
  return true;
}

// Get upcoming sessions for a course
export function getUpcomingSessions(courseId: string, limit: number = 5): SessionPlan[] {
  const plans = getSessionPlansByCourseId(courseId);
  const today = new Date().toISOString().split('T')[0];
  
  return plans
    .filter(p => p.sessionDate >= today && p.status !== 'cancelled')
    .slice(0, limit);
}

// Get course calendar (all session dates)
export function getCourseCalendar(courseId: string): { date: string; sessionNumber: number; title: string; titleAr: string; status: string }[] {
  const plans = getSessionPlansByCourseId(courseId);
  
  return plans.map(p => ({
    date: p.sessionDate,
    sessionNumber: p.sessionNumber,
    title: p.title,
    titleAr: p.titleAr,
    status: p.status,
  }));
}

// Bulk create session plans
export function bulkCreateSessionPlans(plans: CreateSessionPlanInput[]): SessionPlan[] {
  return plans.map(plan => createSessionPlan(plan));
}
