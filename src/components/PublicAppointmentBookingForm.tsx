'use client';

import { useState, useEffect } from 'react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';

interface PublicAppointmentBookingFormProps {
  dictionary: Dictionary;
  locale: string;
}

interface TimeSlot {
  time: string;
  isBooked: boolean;
}

type WizardStep = 'personal' | 'date' | 'time' | 'confirm';

export function PublicAppointmentBookingForm({ dictionary, locale }: PublicAppointmentBookingFormProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
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

  const steps: { id: WizardStep; title: string; icon: any }[] = [
    { id: 'personal', title: dictionary.appointments?.stepPersonal || 'Personal Info', icon: User },
    { id: 'date', title: dictionary.appointments?.stepDate || dictionary.appointments?.preferredDate || 'Select Date', icon: Calendar },
    { id: 'time', title: dictionary.appointments?.stepTime || dictionary.appointments?.preferredTime || 'Select Time', icon: Clock },
    { id: 'confirm', title: dictionary.appointments?.stepConfirm || 'Confirm', icon: CheckCircle2 },
  ];

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

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'personal':
        return formData.fullName && formData.email && formData.phoneNumber;
      case 'date':
        return formData.date;
      case 'time':
        return formData.time;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/appointments/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, locale }),
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
        setCurrentStep('personal');
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
      <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
        <CardContent className="pt-6">
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-50 dark:bg-[#1a1a1a] p-6 border-2 border-[#DDDDDD] dark:border-[#000000]">
                <CheckCircle2 className="h-20 w-20 text-[#262626] dark:text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#262626] dark:text-white">
              {dictionary.appointments?.bookingSuccess || 'Booking Successful!'}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {dictionary.appointments?.bookingSuccessMessage || 'Your appointment has been scheduled. We will contact you soon to confirm.'}
            </p>
            <Button 
              onClick={() => setIsSuccess(false)} 
              size="lg"
              className="bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 transition-colors"
            >
              {dictionary.appointments?.bookAnother || 'Book Another Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
      <CardHeader className="space-y-6">
        <div>
          <CardTitle className="text-2xl md:text-3xl">
            {dictionary.appointments?.appointmentDetails || 'Appointment Details'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {dictionary.appointments?.fillDetails || 'Please fill in your information below'}
          </CardDescription>
        </div>

        {/* Progress Steps */}
        <div className="w-full overflow-x-auto">
          <div className="flex items-center justify-center min-w-max px-4 py-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isActive
                          ? 'bg-[#262626] dark:bg-white border-[#262626] dark:border-white text-white dark:text-[#262626]'
                          : isCompleted
                          ? 'bg-[#262626] dark:bg-white border-[#262626] dark:border-white text-white dark:text-[#262626]'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium text-center whitespace-nowrap transition-colors duration-300 ${
                        isActive ? 'text-[#262626] dark:text-white' : isCompleted ? 'text-[#262626] dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="relative mx-2 w-12">
                      <div className="h-px bg-gray-200 rounded-full"></div>
                      <div 
                        className={`absolute top-0 left-0 h-px rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-[#262626] dark:bg-white w-full' : 'bg-gray-200 dark:bg-[#262626] w-0'
                        }`}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step Content */}
          {currentStep === 'personal' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {dictionary.appointments?.personalInfoTitle || 'Tell Us About Yourself'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dictionary.appointments?.personalInfoDescription || 'We need some information to contact you'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {dictionary.common?.fullName || 'Full Name'} *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={dictionary.appointments?.enterFullName || 'Enter your full name'}
                  className="text-lg h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {dictionary.common?.email || 'Email'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={dictionary.appointments?.enterEmail || 'Enter your email'}
                  className="text-lg h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {dictionary.common?.phoneNumber || 'Phone Number'} *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder={dictionary.appointments?.enterPhone || 'Enter your phone number'}
                  className="text-lg h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                />
              </div>
            </div>
          )}

          {currentStep === 'date' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {dictionary.appointments?.dateTitle || 'Choose Your Preferred Date'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dictionary.appointments?.dateDescription || 'Select the day that works best for you'}
                </p>
              </div>

              {availableDates.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {dictionary.appointment?.noAvailableDates || 'No dates available. Please check back later.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableDates.map((date) => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const isSelected = formData.date === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setFormData({ ...formData, date, time: '' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#262626] dark:border-white bg-gray-50 dark:bg-[#1a1a1a]'
                            : 'border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                            isSelected ? 'bg-[#262626] dark:bg-white text-white dark:text-[#262626]' : 'bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-gray-100'
                          }`}>
                            <span className="text-xs font-medium uppercase">
                              {dateObj.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">
                              {dateObj.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long' })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {dateObj.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { 
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-6 w-6 text-[#262626] dark:text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 'time' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {dictionary.appointments?.timeTitle || 'Pick Your Time Slot'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dictionary.appointments?.bookedSlotsHint || 'Booked slots are shown in red'}
                </p>
              </div>

              {loadingSlots ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#262626] dark:border-white border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-gray-600">{dictionary.common?.loading || 'Loading...'}</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {dictionary.appointment?.noSlotsAvailable || 'No time slots available for this date'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => {
                    const isSelected = formData.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => !slot.isBooked && setFormData({ ...formData, time: slot.time })}
                        disabled={slot.isBooked}
                        className={`relative p-4 rounded-xl border-2 text-center font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'border-[#262626] dark:border-white bg-[#262626] dark:bg-white text-white dark:text-[#262626]'
                            : slot.isBooked
                            ? 'border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-not-allowed opacity-70'
                            : 'border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-[0.99]'
                        }`}
                      >
                        <Clock className={`h-5 w-5 mx-auto mb-2 transition-colors ${
                          isSelected ? 'text-white dark:text-[#262626]' : slot.isBooked ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
                        }`} />
                        <span className="text-sm block">{slot.time}</span>
                        {slot.isBooked && (
                          <>
                            <div className="absolute -top-1 -right-1 z-10">
                              <div className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                              </div>
                            </div>
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                              {dictionary.appointments?.booked || 'Booked'}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {dictionary.appointments?.confirmTitle || 'Confirm Your Booking'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dictionary.appointments?.confirmDescription || 'Review your details before confirming'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{dictionary.appointments?.sectionPersonal || 'Personal Information'}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>{dictionary.appointments?.labelName || 'Name:'}</strong> {formData.fullName}</p>
                    <p><strong>{dictionary.appointments?.labelEmail || 'Email:'}</strong> {formData.email}</p>
                    <p><strong>{dictionary.appointments?.labelPhone || 'Phone:'}</strong> {formData.phoneNumber}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{dictionary.appointments?.sectionSchedule || 'Date & Time'}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>{dictionary.appointments?.labelDate || 'Date:'}</strong> {new Date(formData.date + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                    <p><strong>{dictionary.appointments?.labelTime || 'Time:'}</strong> {formData.time}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    {dictionary.appointments?.additionalNotes || 'Additional Notes'} ({dictionary.common?.optional || 'Optional'})
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={dictionary.appointments?.notesPlaceholder || 'Any additional information...'}
                    className="w-full min-h-[100px] px-4 py-3 text-base bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-lg focus:outline-none focus:border-black/30 dark:focus:border-white/20"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            {currentStep !== 'personal' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 text-base border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626]"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-5 w-5 me-2" />
                {dictionary.common?.back || 'Back'}
              </Button>
            )}
            
            {currentStep !== 'confirm' ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex-1 h-12 text-base bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {dictionary.common?.next || 'Next'}
                <ArrowRight className="h-5 w-5 ms-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-12 text-base bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 me-2" />
                {isSubmitting 
                  ? (dictionary.common?.loading || 'Submitting...') 
                  : (dictionary.appointments?.submitBooking || 'Confirm Booking')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
