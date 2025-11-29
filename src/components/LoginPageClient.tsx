'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { LoginForm } from '@/components/LoginForm';

interface LoginPageClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export default function LoginPageClient({ dictionary, locale }: LoginPageClientProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#DDDDDD] dark:bg-[#000000]">
      <div className="w-full max-w-md">
        <Link 
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#FF5F02] hover:text-[#262626] dark:hover:text-white mb-6 transition-all hover:gap-3"
        >
          <ArrowLeft className="h-5 w-5" />
          {dictionary.nav.home}
        </Link>
        
        <Card className="w-full shadow-2xl border-3 border-[#DDDDDD] dark:border-[#262626] rounded-3xl overflow-hidden bg-white dark:bg-[#262626]">
          <CardHeader className="text-center bg-[#FF5F02] py-8">
            <CardTitle className="text-3xl font-bold text-white">
              {dictionary.auth.loginTitle}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-white mt-2 opacity-90">
              Enter your credentials
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Suspense fallback={<div className="text-center text-purple-600">Loading...</div>}>
              <LoginForm dictionary={dictionary} locale={locale} />
            </Suspense>

            <div className="mt-4 text-center">
              <Link 
                href={`/${locale}/auth/forgot-password`}
                className="text-sm font-semibold text-[#FF5F02] hover:text-[#262626] dark:hover:text-white transition-colors"
              >
                {dictionary.auth.forgotPassword}
              </Link>
            </div>

            <div className="mt-5 text-center p-3 bg-[#DDDDDD] dark:bg-[#262626] rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000]">
              <p className="text-sm font-medium text-[#000000] dark:text-white">
                {dictionary.auth.dontHaveAccount}{' '}
                <Link 
                  href={`/${locale}/book-appointment`}
                  className="text-[#FF5F02] hover:text-[#262626] dark:hover:text-white font-bold underline underline-offset-2 transition-colors"
                >
                  {dictionary.auth.signupButton}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
