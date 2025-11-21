import { NextRequest, NextResponse } from 'next/server';
import { createAppointment } from '@/lib/db/repositories/appointmentRepository';
import { getAllUsers } from '@/lib/db/repositories/userRepository';
import { ROLES } from '@/config/roles';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, date, time, notes, locale } = body;

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

    // Notify Admins
    try {
      const allUsers = await getAllUsers();
      const admins = allUsers.filter(u => u.role === ROLES.ADMIN);
      const adminIds = admins.map(u => u.id);
      const notificationLocale = locale || 'en';

      if (adminIds.length > 0) {
        const { sendNotificationToUsers } = await import('@/lib/notifications/sendNotification');
        await sendNotificationToUsers(adminIds, {
          title: 'New Public Appointment',
          body: `${fullName} has booked an appointment on ${date} at ${time}`,
          type: 'success',
          category: 'appointments',
          url: `/${notificationLocale}/dashboard/appointments`
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify admins:', notifyError);
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
