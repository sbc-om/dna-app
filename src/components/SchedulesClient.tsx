'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, Trash2, Sparkles } from 'lucide-react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

interface SchedulesClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function SchedulesClient({ dictionary, locale }: SchedulesClientProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
  });

  const cardShell = 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const subtleText = 'text-gray-600 dark:text-gray-400';
  const fieldLabelClass = 'text-sm font-semibold text-[#262626] dark:text-white';
  const inputClass = 'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedules?all=true');
      const data = await response.json();
      if (data.success && data.schedules) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSchedules([...schedules, data.schedule]);
        setFormData({
          date: '',
          startTime: '09:00',
          endTime: '17:00',
        });
        toast.success(dictionary.appointment?.scheduleCreated || 'Schedule created successfully');
      } else {
        toast.error(data.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(dictionary.appointment?.confirmDelete || 'Delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSchedules(schedules.filter(s => s.id !== id));
        toast.success(dictionary.appointment?.scheduleDeleted || 'Schedule deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('An error occurred');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/95 dark:bg-[#262626]/95 backdrop-blur-xl shadow-xl"
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center"
              >
                <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white flex items-center gap-2">
                  {dictionary.nav?.schedules || 'Schedules'}
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                </h1>
                <p className={`${subtleText} mt-2`}>Manage available appointment times</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Schedule Card */}
      <Card className={cardShell}>
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <CardTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            {dictionary.appointment?.createSchedule || 'Create Schedule'}
          </CardTitle>
          <CardDescription className={subtleText}>
            Add available dates and time ranges. Time slots will be generated every 10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className={`${fieldLabelClass} flex items-center gap-2`}>
                  <Calendar className="h-4 w-4" />
                  {dictionary.appointment?.selectDate || 'Date'}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={today}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className={`${fieldLabelClass} flex items-center gap-2`}>
                  <Clock className="h-4 w-4" />
                  {dictionary.appointment?.startTime || 'Start Time'}
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className={`${fieldLabelClass} flex items-center gap-2`}>
                  <Clock className="h-4 w-4" />
                  {dictionary.appointment?.endTime || 'End Time'}
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl shadow-lg w-full md:w-auto">
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-blue-600/8 via-purple-600/8 to-pink-600/8"
                animate={{ opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative p-2">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-12 w-full md:w-auto justify-center rounded-xl border-2 border-black/60 bg-[#0b0b0f] text-white hover:bg-[#14141a] px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-semibold">
                    {isCreating ? (dictionary.common?.loading || 'Creating...') : (dictionary.appointment?.createSchedule || 'Create Schedule')}
                  </span>
                  <Sparkles className="h-4 w-4 ml-2 text-white/80" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Schedules List */}
      <Card className={cardShell}>
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <CardTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            {dictionary.nav?.schedules || 'Schedules'}
          </CardTitle>
          <CardDescription className={subtleText}>
            {'Showing'} {schedules.length} {schedules.length === 1 ? 'schedule' : 'schedules'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-purple-600"
              />
              <span className="ml-3 text-sm text-gray-600 dark:text-white/70">{dictionary.common?.loading || 'Loading...'}</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000]">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <p className="text-[#262626] dark:text-white font-bold">No schedules created yet</p>
              <p className={`text-sm mt-2 ${subtleText}`}>Create your first schedule to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.sort((a, b) => a.date.localeCompare(b.date)).map((schedule, idx) => {
                const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const slotsCount = Math.floor((endMinutes - startMinutes) / 10);

                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-4 border-2 border-[#DDDDDD] dark:border-[#000000] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-[#262626] dark:text-white">
                          {new Date(schedule.date + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className={`text-sm ${subtleText} flex items-center gap-2 mt-1`}>
                          <Clock className="h-3 w-3" />
                          {schedule.startTime} - {schedule.endTime}
                          <span className="px-2 py-0.5 bg-purple-600/10 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                            {slotsCount} slots
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      className="h-10 border-2 border-red-500/40 bg-white/80 dark:bg-[#111114] text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#1a1a1d]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
