'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { createAppointmentAction } from '@/lib/actions/appointmentActions';
interface TimeSlot {
  time: string;
  isBooked: boolean;
  appointmentId?: string;
}

interface AppointmentBookingFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function AppointmentBookingForm({ dictionary, locale }: AppointmentBookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Available data
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available dates on mount
  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Load time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    } else {
      setAvailableTimeSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    setLoadingDates(true);
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      
      if (data.success && data.dates) {
        setAvailableDates(data.dates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
    setLoadingDates(false);
  };

  const loadTimeSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/schedules?date=${date}`);
      const data = await response.json();
      
      if (data.success && data.timeSlots) {
        setAvailableTimeSlots(data.timeSlots);
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName || !mobileNumber || !email || !selectedDate || !selectedTime) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await createAppointmentAction({
      fullName,
      mobileNumber,
      email,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      locale,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 2000);
    } else {
      setError(result.error || dictionary.appointment.bookingError);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border-2 border-green-200 dark:border-green-700">
          <p className="text-lg font-bold text-green-800 dark:text-green-200">
            {dictionary.appointment.bookingSuccess}
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            We'll contact you soon to confirm your appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Instructions */}
      <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          {dictionary.appointment.bookingInstructions}
        </p>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            {dictionary.appointment.fullName}
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={dictionary.auth.fullNamePlaceholder}
            required
            className="mt-1.5 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="mobileNumber" className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            {dictionary.appointment.mobileNumber}
          </Label>
          <Input
            id="mobileNumber"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder={dictionary.auth.phoneNumberPlaceholder}
            required
            className="mt-1.5 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            {dictionary.appointment.email}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dictionary.auth.emailPlaceholder}
            required
            className="mt-1.5 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-xl"
          />
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <Label htmlFor="date" className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {dictionary.appointment.selectDate}
        </Label>
        {loadingDates ? (
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">{dictionary.common.loading}</p>
        ) : availableDates.length === 0 ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{dictionary.appointment.noAvailableDates}</p>
        ) : (
          <select
            id="date"
            aria-label={dictionary.appointment.selectDate}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime('');
            }}
            required
            className="mt-1.5 w-full border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-xl p-2.5 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
          >
            <option value="">{dictionary.appointment.selectDate}</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
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

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <Label htmlFor="time" className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {dictionary.appointment.selectTime}
          </Label>
          {loadingSlots ? (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">{dictionary.common.loading}</p>
          ) : availableTimeSlots.length === 0 ? (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{dictionary.appointment.noSlotsAvailable}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {availableTimeSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setSelectedTime(slot.time)}
                  className={`p-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    selectedTime === slot.time
                      ? 'bg-[#30B2D2] text-white border-[#30B2D2]'
                      : 'bg-white dark:bg-gray-800 text-[#000000] dark:text-white border-gray-300 dark:border-gray-700 hover:border-[#30B2D2]'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-red-200 dark:border-red-700">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !selectedDate || !selectedTime}
        className="w-full bg-[#F2574C] hover:bg-[#d94940] text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? dictionary.common.loading : dictionary.appointment.confirmBooking}
      </Button>
    </form>
  );
}
