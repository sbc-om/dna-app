'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useConfirm } from '@/components/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const [activeTab, setActiveTab] = useState<Appointment['status']>('pending');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { confirm, ConfirmDialog } = useConfirm();

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
    await loadAppointments();
  };

  const generateTemporaryPassword = () => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleRegisterUser = async (appointment: Appointment) => {
    const temporaryPassword = generateTemporaryPassword();

    const confirmed = await confirm({
      title: dictionary.appointment?.createAccounts || 'Create Accounts',
      description: [
        dictionary.appointment?.createAccountsPrompt || 'This will create a parent account for this appointment.',
        '',
        `${dictionary.common.fullName}: ${appointment.fullName}`,
        `${dictionary.common.email}: ${appointment.email}`,
        `${dictionary.appointment?.temporaryPassword || 'Temporary password'}: ${temporaryPassword}`,
      ].join('\n'),
      confirmText: dictionary.common?.create || 'Create',
      cancelText: dictionary.common?.cancel || 'Cancel',
    });

    if (!confirmed) return;

    const parentResult = await createUserAction({
      email: appointment.email,
      username: appointment.email.split('@')[0],
      fullName: appointment.fullName,
      phoneNumber: appointment.mobileNumber,
      password: temporaryPassword,
      role: 'parent',
    });

    if (parentResult.success && parentResult.user) {
      await updateAppointmentAction(appointment.id, {
        status: 'completed',
        registeredUserIds: [parentResult.user.id],
      });
      await loadAppointments();

      await confirm({
        title: dictionary.common?.success || 'Success',
        description: [
          dictionary.appointment?.accountCreated || 'Account created successfully.',
          '',
          `${dictionary.common.email}: ${appointment.email}`,
          `${dictionary.appointment?.temporaryPassword || 'Temporary password'}: ${temporaryPassword}`,
        ].join('\n'),
        confirmText: 'OK',
      });
      return;
    }

    await confirm({
      title: dictionary.common?.error || 'Error',
      description: dictionary.appointment?.accountCreateFailed || 'Failed to create account. Please try again.',
      confirmText: 'OK',
      variant: 'destructive',
    });
  };

  const statusBadge = (status: Appointment['status']) => {
    const map: Record<Appointment['status'], { className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { variant: 'outline', className: 'border-[#DDDDDD] text-[#262626] dark:border-[#000000] dark:text-white bg-white dark:bg-[#1a1a1a]' },
      confirmed: { variant: 'outline', className: 'border-[#262626] text-[#262626] dark:border-white dark:text-white bg-white dark:bg-[#1a1a1a]' },
      completed: { variant: 'default', className: 'bg-[#262626] text-white dark:bg-white dark:text-[#262626]' },
      cancelled: { variant: 'destructive', className: '' },
    };

    return (
      <Badge variant={map[status].variant} className={map[status].className}>
        {dictionary.appointment?.[status] || status}
      </Badge>
    );
  };

  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((apt) => {
      if (dateFilter && apt.appointmentDate !== dateFilter) return false;
      if (!q) return true;
      return (
        apt.fullName.toLowerCase().includes(q) ||
        apt.email.toLowerCase().includes(q) ||
        apt.mobileNumber.toLowerCase().includes(q)
      );
    });
  }, [appointments, query, dateFilter]);

  const appointmentsByStatus = (status: Appointment['status']) => {
    return filteredAppointments.filter((apt) => apt.status === status);
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
  };

  const formatAppointmentDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const AppointmentListEmpty = ({ status }: { status: Appointment['status'] }) => (
    <div className="py-12 text-center border-2 border-dashed border-[#DDDDDD] dark:border-[#000000] rounded-2xl bg-white dark:bg-[#1a1a1a]">
      <div className="mx-auto h-12 w-12 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] flex items-center justify-center text-[#262626] dark:text-white">
        <Calendar className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#262626] dark:text-white">
        {dictionary.appointment?.noAppointmentsTitle || 'No appointments'}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {(dictionary.appointment?.noAppointmentsDescription || 'No appointments match your filters.')}
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        {(dictionary.appointment?.[status] || status) + `: ${appointmentsByStatus(status).length}`}
      </p>
    </div>
  );

  const AppointmentCards = ({ items }: { items: Appointment[] }) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
      {items.map((appointment) => (
        <Card
          key={appointment.id}
          className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] cursor-pointer"
          onClick={() => openDetails(appointment)}
        >
          <CardHeader className="px-4 pt-4 pb-2 border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{appointment.fullName}</span>
                </CardTitle>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">{appointment.email}</p>
              </div>
              {statusBadge(appointment.status)}
            </div>
          </CardHeader>
          <CardContent className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Calendar className="h-4 w-4" />
              <span className="truncate">{formatAppointmentDate(appointment.appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>{appointment.appointmentTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Phone className="h-4 w-4" />
              <span className="truncate">{appointment.mobileNumber}</span>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                {dictionary.appointment?.viewDetails || 'View details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const AppointmentTable = ({ items }: { items: Appointment[] }) => (
    <div className="hidden lg:block">
      <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-[#262626]">
            <TableRow className="border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <TableHead className="px-4">{dictionary.appointment?.fullName || dictionary.common.fullName}</TableHead>
              <TableHead className="px-4">{dictionary.appointment?.appointmentDate || 'Appointment Date'}</TableHead>
              <TableHead className="px-4">{dictionary.appointment?.appointmentTime || 'Appointment Time'}</TableHead>
              <TableHead className="px-4">{dictionary.appointment?.mobileNumber || 'Mobile Number'}</TableHead>
              <TableHead className="px-4">{dictionary.appointment?.status || 'Status'}</TableHead>
              <TableHead className="px-4 text-right">{dictionary.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((appointment) => (
              <TableRow
                key={appointment.id}
                className="cursor-pointer border-b border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#262626]"
                onClick={() => openDetails(appointment)}
              >
                <TableCell className="px-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#262626] dark:text-white truncate">{appointment.fullName}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{appointment.email}</div>
                  </div>
                </TableCell>
                <TableCell className="px-4 text-gray-700 dark:text-gray-300">{formatAppointmentDate(appointment.appointmentDate)}</TableCell>
                <TableCell className="px-4 text-gray-700 dark:text-gray-300">{appointment.appointmentTime}</TableCell>
                <TableCell className="px-4 text-gray-700 dark:text-gray-300">{appointment.mobileNumber}</TableCell>
                <TableCell className="px-4">{statusBadge(appointment.status)}</TableCell>
                <TableCell className="px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    onClick={() => openDetails(appointment)}
                  >
                    {dictionary.appointment?.viewDetails || 'View details'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] dark:text-white truncate">
            {dictionary.nav.appointments}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {dictionary.appointment?.viewAppointments || 'View appointments'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626]"
            onClick={loadAppointments}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {dictionary.appointment?.refresh || 'Refresh'}
          </Button>
          <Link href={`/${locale}/dashboard/schedules`}>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626]"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {dictionary.nav.schedules}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a]">
        <CardHeader className="pb-4 border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg font-bold text-[#262626] dark:text-white">
              {dictionary.appointment?.manageAppointments || dictionary.nav.appointments}
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={dictionary.appointment?.searchPlaceholder || 'Search by name, email, or phone'}
                  className="pl-9 h-10 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                aria-label={dictionary.appointment?.filterByDate || 'Filter by date'}
              />
              {(query || dateFilter) && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  onClick={() => {
                    setQuery('');
                    setDateFilter('');
                  }}
                >
                  {dictionary.common?.clear || 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Appointment['status'])}>
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 rounded-2xl p-1 bg-gray-50 dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
              <TabsTrigger value="pending" className="rounded-xl font-semibold">
                {(dictionary.appointment?.pending || 'Pending')} ({appointmentsByStatus('pending').length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-xl font-semibold">
                {(dictionary.appointment?.confirmed || 'Confirmed')} ({appointmentsByStatus('confirmed').length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl font-semibold">
                {(dictionary.appointment?.completed || 'Completed')} ({appointmentsByStatus('completed').length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl font-semibold">
                {(dictionary.appointment?.cancelled || 'Cancelled')} ({appointmentsByStatus('cancelled').length})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
                {dictionary.common.loading}
              </div>
            ) : (
              <>
                {(['pending', 'confirmed', 'completed', 'cancelled'] as Appointment['status'][]).map((status) => {
                  const items = appointmentsByStatus(status);
                  return (
                    <TabsContent key={status} value={status} className="mt-4">
                      {items.length === 0 ? (
                        <AppointmentListEmpty status={status} />
                      ) : (
                        <>
                          <AppointmentCards items={items} />
                          <AppointmentTable items={items} />
                        </>
                      )}
                    </TabsContent>
                  );
                })}
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#262626] dark:text-white">
                  {dictionary.appointment.appointmentDetails}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-2">
                  {statusBadge(selectedAppointment.status)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAppointmentDate(selectedAppointment.appointmentDate)} • {selectedAppointment.appointmentTime}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#262626] p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] flex items-center justify-center text-[#262626] dark:text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#262626] dark:text-white truncate">{selectedAppointment.fullName}</div>
                      <div className="mt-1 flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{selectedAppointment.email}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="truncate">{selectedAppointment.mobileNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] p-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.appointment.appointmentDate}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#262626] dark:text-white">
                      <Calendar className="h-4 w-4" />
                      {formatAppointmentDate(selectedAppointment.appointmentDate)}
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] p-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.appointment.appointmentTime}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#262626] dark:text-white">
                      <Clock className="h-4 w-4" />
                      {selectedAppointment.appointmentTime}
                    </div>
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
                      className="w-full h-11 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 font-semibold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {dictionary.appointment?.confirmAction || 'Confirm appointment'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, 'cancelled');
                        setDetailsOpen(false);
                      }}
                      className="w-full h-11 font-semibold"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {dictionary.appointment?.cancelAction || 'Cancel appointment'}
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
                      className="w-full h-11 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 font-semibold"
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

      <ConfirmDialog />
    </div>
  );
}
