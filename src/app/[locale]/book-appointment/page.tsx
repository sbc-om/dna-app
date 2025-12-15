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
    <div className="flex flex-col h-screen overflow-hidden">
      <Header dictionary={dictionary} locale={locale} user={user} />
      
      <main className="flex-1 overflow-y-auto bg-[#DDDDDD] dark:bg-[#000000]">
        <div className="min-h-full flex flex-col">
          <div className="flex-1">
            <div className="max-w-3xl mx-auto py-10 px-4">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#262626] dark:text-white mb-3">
                  {dictionary.appointments?.bookAppointment || 'Book an Appointment'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {dictionary.appointments?.bookingDescription || 'Fill in your details to schedule an appointment with us'}
                </p>
              </div>

              <PublicAppointmentBookingForm dictionary={dictionary} locale={locale} />
            </div>
          </div>
          
          <Footer dictionary={dictionary} locale={locale} />
        </div>
      </main>
    </div>
  );
}
