import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateId } from '@/lib/db/lmdb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, date, time, notes } = body;

    // Validation
    if (!fullName || !email || !phoneNumber || !date || !time) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Create public appointment record
    const db = getDatabase();
    const appointmentId = generateId();
    
    const appointment = {
      id: appointmentId,
      fullName,
      email,
      phoneNumber,
      date,
      time,
      notes: notes || '',
      status: 'pending', // pending, confirmed, cancelled
      type: 'public', // public booking (not logged in)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in LMDB
    await db.put(`public_appointments:${appointmentId}`, appointment);
    
    // Also create an index by email for easy lookup
    await db.put(`public_appointments_by_email:${email}:${appointmentId}`, appointmentId);

    console.log('✅ Public appointment created:', appointmentId);

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointmentId,
        fullName,
        email,
        date,
        time,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('Error creating public appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List all public appointments (for admin)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const appointments: any[] = [];

    // Get all public appointments
    for await (const { key, value } of db.getRange({ 
      start: 'public_appointments:', 
      end: 'public_appointments:\uffff' 
    })) {
      if (typeof key === 'string' && key.startsWith('public_appointments:') && !key.includes('_by_email')) {
        appointments.push(value);
      }
    }

    // Sort by creation date (newest first)
    appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      appointments,
    });

  } catch (error) {
    console.error('Error fetching public appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
