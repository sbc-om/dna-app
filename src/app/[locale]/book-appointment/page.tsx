import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PublicAppointmentBookingForm } from '@/components/PublicAppointmentBookingForm';
import { getCurrentUser } from '@/lib/auth/auth';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function BookAppointmentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const dictionary = await getDictionary(locale);
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header dictionary={dictionary} locale={locale} user={user} />
      
  <main className="flex-1 bg-linear-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {dictionary.appointments?.bookAppointment || 'Book an Appointment'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {dictionary.appointments?.bookingDescription || 'Fill in your details to schedule an appointment with us'}
            </p>
          </div>

          <PublicAppointmentBookingForm dictionary={dictionary} locale={locale} />
        </div>
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
