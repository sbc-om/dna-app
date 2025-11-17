'use client';

import { useState, useEffect } from 'react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Phone, CheckCircle2 } from 'lucide-react';

interface PublicAppointmentBookingFormProps {
  dictionary: Dictionary;
  locale: string;
}

interface TimeSlot {
  time: string;
  isBooked: boolean;
}

export function PublicAppointmentBookingForm({ dictionary, locale }: PublicAppointmentBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    date: '',
    time: '',
    notes: '',
  });

  // Load available dates on mount
  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Load time slots when date changes
  useEffect(() => {
    if (formData.date) {
      loadTimeSlots(formData.date);
    } else {
      setTimeSlots([]);
    }
  }, [formData.date]);

  const loadAvailableDates = async () => {
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      if (data.success && data.dates) {
        setAvailableDates(data.dates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadTimeSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/schedules?date=${date}`);
      const data = await response.json();
      if (data.success && data.timeSlots) {
        setTimeSlots(data.timeSlots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
    setLoadingSlots(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/appointments/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          date: '',
          time: '',
          notes: '',
        });
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">
              {dictionary.appointments?.bookingSuccess || 'Booking Successful!'}
            </h3>
            <p className="text-green-700 dark:text-green-400">
              {dictionary.appointments?.bookingSuccessMessage || 'Your appointment has been scheduled. We will contact you soon to confirm.'}
            </p>
            <Button onClick={() => setIsSuccess(false)} className="bg-green-600 hover:bg-green-700 text-white">
              {dictionary.appointments?.bookAnother || 'Book Another Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
      <CardHeader>
        <CardTitle className="text-2xl">
          {dictionary.appointments?.appointmentDetails || 'Appointment Details'}
        </CardTitle>
        <CardDescription>
          {dictionary.appointments?.fillDetails || 'Please fill in your information below'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {dictionary.common?.fullName || 'Full Name'} *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={dictionary.appointments?.enterFullName || 'Enter your full name'}
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {dictionary.common?.email || 'Email'} *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={dictionary.appointments?.enterEmail || 'Enter your email'}
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {dictionary.common?.phoneNumber || 'Phone Number'} *
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder={dictionary.appointments?.enterPhone || 'Enter your phone number'}
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dictionary.appointments?.preferredDate || 'Preferred Date'} *
            </Label>
            {availableDates.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 border rounded-md">
                {dictionary.appointment?.noAvailableDates || 'No dates available. Please check back later.'}
              </p>
            ) : (
              <select
                id="date"
                aria-label={dictionary.appointment?.selectDate || 'Select a date'}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                required
                className="w-full px-3 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{dictionary.appointment?.selectDate || 'Select a date'}</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {formData.date && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {dictionary.appointments?.preferredTime || 'Preferred Time'} *
              </Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground p-3 border rounded-md">
                  {dictionary.common?.loading || 'Loading...'}
                </p>
              ) : timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 border rounded-md">
                  {dictionary.appointment?.noSlotsAvailable || 'No time slots available for this date'}
                </p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setFormData({ ...formData, time: slot.time })}
                      disabled={slot.isBooked}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                        formData.time === slot.time
                          ? 'bg-purple-600 text-white border-purple-600'
                          : slot.isBooked
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {dictionary.appointments?.additionalNotes || 'Additional Notes'} ({dictionary.common?.optional || 'Optional'})
            </Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={dictionary.appointments?.notesPlaceholder || 'Any additional information...'}
              className="w-full min-h-[100px] px-3 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !formData.date || !formData.time}
            className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? (dictionary.common?.loading || 'Submitting...') 
              : (dictionary.appointments?.submitBooking || 'Submit Booking')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
