import { NextRequest, NextResponse } from 'next/server';
import { createAppointment } from '@/lib/db/repositories/appointmentRepository';

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

    // Create appointment using appointmentRepository
    const appointment = await createAppointment({
      fullName,
      mobileNumber: phoneNumber,
      email,
      appointmentDate: date,
      appointmentTime: time,
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Selected time slot is no longer available' }, { status: 409 });
    }

    console.log('✅ Public appointment created:', appointment.id);

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        fullName: appointment.fullName,
        email: appointment.email,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status,
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
