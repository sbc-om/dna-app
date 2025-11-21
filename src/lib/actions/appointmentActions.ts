'use server';

import {
  createAppointment,
  getAllAppointments,
  updateAppointment,
  type Appointment,
} from '@/lib/db/repositories/appointmentRepository';
import { getAvailableDates, getSchedulesByDate } from '@/lib/db/repositories/scheduleRepository';
import { getAllUsers } from '@/lib/db/repositories/userRepository';
import { ROLES } from '@/config/roles';

export async function createAppointmentAction(data: {
  fullName: string;
  mobileNumber: string;
  email: string;
  appointmentDate: string;
  appointmentTime: string;
  locale?: string;
}) {
  try {
    const appointment = await createAppointment(data);
    
    if (!appointment) {
      return { success: false, error: 'Time slot is not available' };
    }

    // Notify Admins
    try {
      const allUsers = await getAllUsers();
      const admins = allUsers.filter(u => u.role === ROLES.ADMIN);
      const adminIds = admins.map(u => u.id);
      const locale = data.locale || 'en';

      if (adminIds.length > 0) {
        const { sendNotificationToUsers } = await import('@/lib/notifications/sendNotification');
        await sendNotificationToUsers(adminIds, {
          title: 'New Appointment Booked',
          body: `${data.fullName} has booked an appointment on ${data.appointmentDate} at ${data.appointmentTime}`,
          type: 'success',
          category: 'appointments',
          url: `/${locale}/dashboard/appointments`
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify admins:', notifyError);
      // Don't fail the appointment creation if notification fails
    }
    
    return { success: true, appointment };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: 'Failed to create appointment' };
  }
}

export async function getAppointmentsAction() {
  try {
    const appointments = await getAllAppointments();
    return { success: true, appointments };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { success: false, error: 'Failed to fetch appointments' };
  }
}

export async function updateAppointmentAction(id: string, updates: Partial<Appointment>) {
  try {
    const appointment = await updateAppointment(id, updates);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }
    return { success: true, appointment };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: false, error: 'Failed to update appointment' };
  }
}

export async function getAvailableDatesAction() {
  try {
    const dates = await getAvailableDates();
    return { success: true, dates };
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return { success: false, error: 'Failed to fetch available dates' };
  }
}

export async function getScheduleByDateAction(date: string) {
  try {
    const schedules = await getSchedulesByDate(date);
    return { success: true, schedules };
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return { success: false, error: 'Failed to fetch schedule' };
  }
}
