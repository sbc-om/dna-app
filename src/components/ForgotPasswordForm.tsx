'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

interface ForgotPasswordPageClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export default function ForgotPasswordPageClient({ dictionary, locale }: ForgotPasswordPageClientProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement actual password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (error) {
      setError(dictionary.errors?.serverError || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href={`/${locale}`} className="flex items-center justify-center space-x-2 mb-4">
              <Image 
                src="/logo-white.png" 
                alt="DNA Logo" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">DNA</span>
            </Link>
            <CardTitle className="text-2xl text-green-600">
              {dictionary.auth.emailSent || 'Email Sent'}
            </CardTitle>
            <CardDescription>
              {dictionary.auth.resetEmailSent || "We've sent a password reset link to your email address. Please check your inbox."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/auth/login`}>
              <Button className="w-full">
                {dictionary.auth.backToLogin || 'Back to Login'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href={`/${locale}`} className="flex items-center justify-center space-x-2 mb-4">
            <Image 
              src="/logo-white.png" 
              alt="DNA Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-xl">DNA</span>
          </Link>
          <CardTitle className="text-2xl">{dictionary.auth.forgotPassword}</CardTitle>
          <CardDescription>
            {dictionary.auth.resetPasswordDescription || 'Enter your email address and we will send you a link to reset your password.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{dictionary.common.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={dictionary.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? dictionary.common.loading : (dictionary.auth.sendResetLink || 'Send Reset Link')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href={`/${locale}/auth/login`}
              className="text-sm text-primary hover:underline"
            >
              {dictionary.auth.backToLogin || 'Back to Login'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
