'use client';

import { useState } from 'react';
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

export function PublicAppointmentBookingForm({ dictionary, locale }: PublicAppointmentBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    date: '',
    time: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/appointments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        
        // Reset success message after 5 seconds
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
            <Button
              onClick={() => setIsSuccess(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
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
          {/* Full Name */}
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

          {/* Email */}
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

          {/* Phone Number */}
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dictionary.appointments?.preferredDate || 'Preferred Date'} *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="text-lg"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {dictionary.appointments?.preferredTime || 'Preferred Time'} *
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              className="text-lg"
            />
          </div>

          {/* Notes */}
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6"
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
