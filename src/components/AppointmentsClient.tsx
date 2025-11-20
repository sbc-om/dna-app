'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Phone, User, CheckCircle, XCircle, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import {
  getAppointmentsAction,
  updateAppointmentAction,
} from '@/lib/actions/appointmentActions';
import { createUserAction } from '@/lib/actions/userActions';
import type { Appointment } from '@/lib/db/repositories/appointmentRepository';

interface AppointmentsClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function AppointmentsClient({ dictionary, locale }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const result = await getAppointmentsAction();
    if (result.success && result.appointments) {
      setAppointments(result.appointments);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: Appointment['status']) => {
    await updateAppointmentAction(id, { status });
    loadAppointments();
  };

  const handleRegisterUser = async (appointment: Appointment) => {
    const confirmed = confirm(
      `This will create a parent account for:\n${appointment.fullName}\n\nEmail: ${appointment.email}\nPassword: 11111111\n\nProceed?`
    );
    
    if (!confirmed) return;

    // Create parent account with default password 11111111
    const parentResult = await createUserAction({
      email: appointment.email,
      username: appointment.email.split('@')[0],
      fullName: appointment.fullName,
      phoneNumber: appointment.mobileNumber,
      password: '11111111',
      role: 'parent',
    });

    if (parentResult.success) {
      await updateAppointmentAction(appointment.id, {
        status: 'completed',
        registeredUserIds: [parentResult.user!.id],
      });
      loadAppointments();
      alert(`Parent account created successfully!\n\nEmail: ${appointment.email}\nPassword: 11111111\n\nThe parent can now login and add their children.`);
    } else {
      alert('Failed to create parent account. Please try again.');
    }
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const variants: Record<Appointment['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      confirmed: { variant: 'default', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      completed: { variant: 'default', color: 'bg-green-100 text-green-800 border-green-300' },
      cancelled: { variant: 'destructive', color: 'bg-red-100 text-red-800 border-red-300' },
    };

    return (
      <Badge className={`${variants[status].color} border-2 font-semibold`}>
        {dictionary.appointment[status]}
      </Badge>
    );
  };

  const filterAppointments = (status: Appointment['status']) => {
    return appointments.filter(apt => apt.status === status);
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
      onClick={() => {
        setSelectedAppointment(appointment);
        setDetailsOpen(true);
      }}
    >
      <CardHeader className="bg-white dark:bg-gray-950 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            {appointment.fullName}
          </CardTitle>
          {getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Calendar className="h-4 w-4" />
          {new Date(appointment.appointmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4" />
          {appointment.appointmentTime}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Mail className="h-4 w-4" />
          {appointment.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Phone className="h-4 w-4" />
          {appointment.mobileNumber}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dictionary.nav.appointments}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {dictionary.appointment.viewAppointments}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/schedules`}>
          <Button className="bg-[#F2574C] hover:bg-[#d94841] text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {dictionary.nav.schedules}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-xl p-1 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="pending" className="rounded-xl">
            {dictionary.appointment.pending} ({filterAppointments('pending').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="rounded-xl">
            {dictionary.appointment.confirmed} ({filterAppointments('confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl">
            {dictionary.appointment.completed} ({filterAppointments('completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-xl">
            {dictionary.appointment.cancelled} ({filterAppointments('cancelled').length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">{dictionary.common.loading}</p>
        ) : (
          <>
            <TabsContent value="pending">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterAppointments('pending').map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="confirmed">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterAppointments('confirmed').map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterAppointments('completed').map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="cancelled">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterAppointments('cancelled').map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-xl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dictionary.appointment.appointmentDetails}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {getStatusBadge(selectedAppointment.status)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {dictionary.appointment.fullName}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAppointment.fullName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {dictionary.appointment.email}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAppointment.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {dictionary.appointment.mobileNumber}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAppointment.mobileNumber}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {dictionary.appointment.appointmentDate}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedAppointment.appointmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {dictionary.appointment.appointmentTime}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAppointment.appointmentTime}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-2">
                {selectedAppointment.status === 'pending' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'confirmed');
                        setDetailsOpen(false);
                      }}
                      className="w-full bg-[#30B2D2] hover:bg-[#2799B5] text-white font-semibold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Appointment
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'cancelled');
                        setDetailsOpen(false);
                      }}
                      className="w-full font-semibold"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  </div>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <div className="w-full">
                    <Button
                      onClick={() => {
                        handleRegisterUser(selectedAppointment);
                        setDetailsOpen(false);
                      }}
                      className="w-full bg-[#F2574C] hover:bg-[#D84B40] text-white font-semibold"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {dictionary.appointment.createAccounts}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function generateRandomPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
