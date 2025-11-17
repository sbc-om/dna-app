import { getDatabase, generateId } from '../lmdb';

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format (e.g., "09:00")
  endTime: string; // HH:MM format (e.g., "17:00")
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  time: string; // HH:MM format
  isBooked: boolean;
  appointmentId?: string;
}

const SCHEDULE_PREFIX = 'schedules:';
const SCHEDULE_BY_DATE_PREFIX = 'schedules_by_date:';
const BOOKED_SLOTS_PREFIX = 'booked_slots:'; // booked_slots:{date}:{time}

/**
 * Generate 10-minute time slots between start and end time
 */
export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 10) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
  }
  
  return slots;
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: {
  date: string;
  startTime: string;
  endTime: string;
}): Promise<Schedule> {
  const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const schedule: Schedule = {
    id,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    createdAt: now,
    updatedAt: now,
  };

  // Store main record
  const db = getDatabase();
  await db.put(`${SCHEDULE_PREFIX}${id}`, schedule);
  
  // Store by date for quick lookup
  await db.put(`${SCHEDULE_BY_DATE_PREFIX}${data.date}:${id}`, schedule);

  return schedule;
}

/**
 * Get all schedules
 */
export async function getAllSchedules(): Promise<Schedule[]> {
  const schedules: Schedule[] = [];
  const db = getDatabase();
  
  try {
    // Use synchronous iteration for LMDB
    for (const { key, value } of db.getRange({ start: SCHEDULE_PREFIX, end: SCHEDULE_PREFIX + '~' })) {
      if (value && typeof value === 'object' && 'id' in value && typeof key === 'string' && key.startsWith(SCHEDULE_PREFIX)) {
        // Skip index entries
        if (key === 'schedules:index') continue;
        schedules.push(value as Schedule);
      }
    }
  } catch (error) {
    // If no schedules exist, return empty array
    console.log('No schedules found in database');
    return [];
  }
  
  return schedules.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get schedules by date
 */
export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
  const schedules: Schedule[] = [];
  const prefix = `${SCHEDULE_BY_DATE_PREFIX}${date}:`;
  const db = getDatabase();
  
  try {
    for (const { value } of db.getRange({ start: prefix, end: prefix + '~' })) {
      if (value && typeof value === 'object' && 'id' in value) {
        schedules.push(value as Schedule);
      }
    }
  } catch (error) {
    // If no schedules exist for this date, return empty array
    console.log(`No schedules found for date: ${date}`);
    return [];
  }
  
  return schedules;
}

/**
 * Get all available dates (dates that have schedules)
 */
export async function getAvailableDates(): Promise<string[]> {
  const dates = new Set<string>();
  const today = new Date().toISOString().split('T')[0];
  const db = getDatabase();
  
  try {
    for (const { key, value } of db.getRange({ start: SCHEDULE_PREFIX, end: SCHEDULE_PREFIX + '~' })) {
      if (value && typeof value === 'object' && 'date' in value && typeof key === 'string' && key.startsWith(SCHEDULE_PREFIX)) {
        // Skip index entries
        if (key === 'schedules:index') continue;
        const schedule = value as Schedule;
        // Only include dates that are today or in the future
        if (schedule.date >= today) {
          dates.add(schedule.date);
        }
      }
    }
  } catch (error) {
    // If no schedules exist, return empty array
    console.log('No schedules found in database');
    return [];
  }
  
  return Array.from(dates).sort();
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableTimeSlots(date: string): Promise<TimeSlot[]> {
  const schedules = await getSchedulesByDate(date);
  
  if (schedules.length === 0) {
    return [];
  }
  
  // Collect all time slots from all schedules for this date
  const allSlots = new Set<string>();
  for (const schedule of schedules) {
    const slots = generateTimeSlots(schedule.startTime, schedule.endTime);
    slots.forEach(slot => allSlots.add(slot));
  }
  
  // Check which slots are booked
  const timeSlots: TimeSlot[] = [];
  const db = getDatabase();
  for (const time of Array.from(allSlots).sort()) {
    const bookedKey = `${BOOKED_SLOTS_PREFIX}${date}:${time}`;
    const isBooked = await db.get(bookedKey);
    
    timeSlots.push({
      time,
      isBooked: !!isBooked,
      appointmentId: isBooked || undefined,
    });
  }
  
  return timeSlots;
}

/**
 * Book a time slot
 */
export async function bookTimeSlot(
  date: string,
  time: string,
  appointmentId: string
): Promise<void> {
  const key = `${BOOKED_SLOTS_PREFIX}${date}:${time}`;
  const db = getDatabase();
  await db.put(key, appointmentId);
}

/**
 * Check if a time slot is available
 */
export async function isTimeSlotAvailable(date: string, time: string): Promise<boolean> {
  const key = `${BOOKED_SLOTS_PREFIX}${date}:${time}`;
  const db = getDatabase();
  const bookedAppointment = await db.get(key);
  return !bookedAppointment;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  const db = getDatabase();
  const schedule = await db.get(`${SCHEDULE_PREFIX}${id}`) as Schedule | undefined;
  
  if (schedule) {
    // Delete main record
    await db.remove(`${SCHEDULE_PREFIX}${id}`);
    
    // Delete date index
    await db.remove(`${SCHEDULE_BY_DATE_PREFIX}${schedule.date}:${id}`);
  }
}

/**
 * Get a schedule by ID
 */
export async function getScheduleById(id: string): Promise<Schedule | null> {
  const db = getDatabase();
  const schedule = await db.get(`${SCHEDULE_PREFIX}${id}`) as Schedule | undefined;
  return schedule || null;
}
