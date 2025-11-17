import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import {
  createSchedule,
  getAllSchedules,
  getAvailableDates,
  getAvailableTimeSlots,
  deleteSchedule,
  type Schedule,
} from '@/lib/db/repositories/scheduleRepository';
import { isAdmin } from '@/config/roles';

/**
 * GET /api/schedules
 * Public: Get available dates and optionally time slots for a specific date
 * Query params:
 *   - date: (optional) if provided, returns time slots for that date
 *   - all: (optional, admin only) if true, returns all schedules
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const showAll = searchParams.get('all') === 'true';

  try {
    // If requesting all schedules (admin view)
    if (showAll) {
      const user = await getCurrentUser();
      if (!user || !isAdmin(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const schedules = await getAllSchedules();
      return NextResponse.json({ success: true, schedules });
    }

    // If requesting time slots for a specific date (public)
    if (date) {
      const timeSlots = await getAvailableTimeSlots(date);
      return NextResponse.json({ 
        success: true, 
        date,
        timeSlots: timeSlots.filter(slot => !slot.isBooked) // Only show available slots
      });
    }

    // Otherwise return available dates (public)
    const dates = await getAvailableDates();
    return NextResponse.json({ success: true, dates });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules
 * Admin only: Create a new schedule
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, startTime, endTime } = body;

    // Validation
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Validate that end time is after start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const schedule = await createSchedule({ date, startTime, endTime });

    return NextResponse.json({ success: true, schedule });

  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules
 * Admin only: Delete a schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    await deleteSchedule(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
