'use server';

import {
  createAppointment,
  getAllAppointments,
  updateAppointment,
  type Appointment,
} from '@/lib/db/repositories/appointmentRepository';

export async function createAppointmentAction(data: {
  fullName: string;
  mobileNumber: string;
  email: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  try {
    const appointment = await createAppointment(data);
    
    if (!appointment) {
      return { success: false, error: 'Time slot is not available' };
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
