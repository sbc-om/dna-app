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
          className="inline-flex items-center gap-2 text-sm font-medium text-[#262626] dark:text-white hover:underline mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          {dictionary.nav.home}
        </Link>
        
        <Card className="w-full border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl overflow-hidden bg-white dark:bg-[#262626]">
          <CardHeader className="text-center bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-8">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] flex items-center justify-center">
                <Image src="/logo.png" alt="DNA" width={40} height={40} priority />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#262626] dark:text-white">
              {dictionary.auth.loginTitle}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">
              {dictionary.auth?.loginSubtitle || dictionary.auth?.loginTitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Suspense fallback={<div className="text-center text-sm text-gray-600 dark:text-gray-400">{dictionary.common.loading}</div>}>
              <LoginForm dictionary={dictionary} locale={locale} />
            </Suspense>

            <div className="mt-4 text-center">
              <Link 
                href={`/${locale}/auth/forgot-password`}
                className="text-sm font-semibold text-[#262626] dark:text-white hover:underline"
              >
                {dictionary.auth.forgotPassword}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
