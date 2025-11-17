'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

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
        alert(dictionary.appointment?.scheduleCreated || 'Schedule created successfully');
      } else {
        alert(data.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('An error occurred');
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
        alert(dictionary.appointment?.scheduleDeleted || 'Schedule deleted successfully');
      } else {
        alert(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('An error occurred');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {dictionary.appointment?.createSchedule || 'Create Schedule'}
          </CardTitle>
          <CardDescription>
            Add available dates and time ranges. Time slots will be generated every 10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {dictionary.appointment?.startTime || 'Start Time'}
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {dictionary.appointment?.endTime || 'End Time'}
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isCreating} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? (dictionary.common?.loading || 'Creating...') : (dictionary.appointment?.createSchedule || 'Create Schedule')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.nav?.schedules || 'Schedules'}</CardTitle>
          <CardDescription>Manage available appointment times</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">{dictionary.common?.loading || 'Loading...'}</p>
          ) : schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No schedules created yet</p>
          ) : (
            <div className="space-y-3">
              {schedules.sort((a, b) => a.date.localeCompare(b.date)).map((schedule) => {
                const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const slotsCount = Math.floor((endMinutes - startMinutes) / 10);

                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(schedule.date + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {schedule.startTime} - {schedule.endTime}
                          <span className="text-xs">({slotsCount} slots)</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
