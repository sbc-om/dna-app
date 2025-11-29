'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { AppointmentBookingForm } from '@/components/AppointmentBookingForm';

interface RegisterPageClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export default function RegisterPageClient({ dictionary, locale }: RegisterPageClientProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#DDDDDD] dark:bg-[#000000]">
      <div className="w-full max-w-2xl">
        <Link 
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 mb-6 transition-all hover:gap-3"
        >
          <ArrowLeft className="h-5 w-5" />
          {dictionary.nav.home}
        </Link>
        
        <Card className="w-full shadow-2xl border-3 border-blue-200 dark:border-blue-700 rounded-3xl overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <CardHeader className="text-center bg-white dark:bg-[#262626] py-6 border-b border-[#DDDDDD] dark:border-[#262626]">
            <Link href={`/${locale}`} className="flex items-center justify-center mb-4">
              <Image 
                src="/logo.png" 
                alt="DNA Logo" 
                width={80} 
                height={80}
                className="h-20 w-20 object-contain"
              />
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {dictionary.auth.signupTitle}
              </CardTitle>
            </div>
            <CardDescription className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
              {dictionary.auth.registerDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <AppointmentBookingForm dictionary={dictionary} locale={locale} />

            <div className="mt-5 text-center p-3 bg-[#DDDDDD] dark:bg-[#262626] rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626]">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {dictionary.auth.alreadyHaveAccount}{' '}
                <Link 
                  href={`/${locale}/auth/login`}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold underline underline-offset-2 transition-colors"
                >
                  {dictionary.auth.loginButton}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
