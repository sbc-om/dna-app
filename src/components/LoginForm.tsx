'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

interface LoginFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

type WizardStep = 'email' | 'password' | 'twoFactor';

export function LoginForm({ dictionary, locale }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<WizardStep>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      setError(dictionary.auth?.emailRequired || dictionary.errors.validationError);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(dictionary.auth?.invalidEmail || dictionary.errors.validationError);
      return;
    }

    // Move to password step
    setCurrentStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if 2FA is required
        if (data.requiresTwoFactor) {
          setNeedsTwoFactor(true);
          setCurrentStep('twoFactor');
          return;
        }
        
        setError(data.error || dictionary.errors.serverError);
        return;
      }

      // Get redirect URL from query params or default to dashboard
      const redirectUrl = searchParams.get('redirect') || `/${locale}/dashboard`;
      
      // Force a full page reload to ensure cookie is available
      window.location.href = redirectUrl;
    } catch (err) {
      setError(dictionary.errors.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          code: formData.twoFactorCode 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      // Get redirect URL from query params or default to dashboard
      const redirectUrl = searchParams.get('redirect') || `/${locale}/dashboard`;
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : dictionary.errors.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    setError('');
    if (currentStep === 'password') {
      setCurrentStep('email');
    } else if (currentStep === 'twoFactor') {
      setCurrentStep('password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className={`flex items-center gap-2 transition-all duration-300 ${
          currentStep === 'email' 
            ? 'scale-110' 
            : 'opacity-50'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
            currentStep !== 'email' 
              ? 'bg-[#262626] text-white dark:bg-white dark:text-[#262626]' 
              : 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white'
          }`}>
            {currentStep !== 'email' ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.email}</span>
        </div>
        
        <div className={`w-12 h-1 transition-all ${
          currentStep !== 'email' ? 'bg-[#262626] dark:bg-white' : 'bg-[#DDDDDD] dark:bg-[#262626]'
        }`} />
        
        <div className={`flex items-center gap-2 transition-all duration-300 ${
          currentStep === 'password' 
            ? 'scale-110' 
            : 'opacity-50'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
            currentStep === 'twoFactor'
              ? 'bg-[#262626] text-white dark:bg-white dark:text-[#262626]' 
              : currentStep === 'password'
              ? 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white'
              : 'bg-[#DDDDDD] dark:bg-[#1a1a1a] text-[#262626] dark:text-white'
          }`}>
            {currentStep === 'twoFactor' ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
          <span className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.password}</span>
        </div>

        {needsTwoFactor && (
          <>
            <div className={`w-12 h-1 transition-all ${
              currentStep === 'twoFactor' ? 'bg-[#262626] dark:bg-white' : 'bg-[#DDDDDD] dark:bg-[#262626]'
            }`} />
            
            <div className={`flex items-center gap-2 transition-all duration-300 ${
              currentStep === 'twoFactor' 
                ? 'scale-110' 
                : 'opacity-50'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentStep === 'twoFactor'
                  ? 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white'
                  : 'bg-[#DDDDDD] dark:bg-[#1a1a1a] text-[#262626] dark:text-white'
              }`}>
                3
              </div>
              <span className="text-sm font-semibold text-[#262626] dark:text-white">2FA</span>
            </div>
          </>
        )}
      </div>

      {/* Step 1: Email */}
      {currentStep === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-[#262626] dark:text-white">
              {dictionary.common.email}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-300" />
              <Input
                id="email"
                type="email"
                placeholder={dictionary.auth.emailPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoFocus
                className="pl-10 h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 font-semibold transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              {dictionary.common?.continue || 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        </form>
      )}

      {/* Step 2: Password */}
      {currentStep === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-[#DDDDDD] dark:border-[#000000]">
            <p className="text-sm text-[#262626] dark:text-white font-medium truncate">
              <Mail className="w-4 h-4 inline mr-2 text-gray-500 dark:text-gray-300" />
              {formData.email}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-[#262626] dark:text-white">
              {dictionary.common.password}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-300" />
              <Input
                id="password"
                type="password"
                placeholder={dictionary.auth.passwordPlaceholder}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoFocus
                className="pl-10 h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link 
              href={`/${locale}/auth/forgot-password`}
              className="text-sm text-[#262626] dark:text-white hover:underline"
            >
              {dictionary.auth.forgotPassword}
            </Link>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button"
              onClick={goBack}
              variant="outline"
              className="h-12 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 font-semibold transition-colors" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {dictionary.common.loading}
                </span>
              ) : (
                dictionary.auth.loginButton
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: Two-Factor Authentication (optional) */}
      {currentStep === 'twoFactor' && (
        <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#DDDDDD] dark:border-[#000000]">
              <Shield className="w-8 h-8 text-[#262626] dark:text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#262626] dark:text-white mb-2">
              {dictionary.auth?.twoFactorTitle || 'Two-Factor Authentication'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dictionary.auth?.twoFactorDescription || 'Enter the verification code from your authenticator app'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twoFactorCode" className="text-sm font-medium text-[#262626] dark:text-white">
              {dictionary.auth?.verificationCode || 'Verification Code'}
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-300" />
              <Input
                id="twoFactorCode"
                type="text"
                placeholder="000000"
                value={formData.twoFactorCode}
                onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value })}
                required
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
                className="pl-10 h-12 text-center text-2xl font-mono tracking-widest bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              type="button"
              onClick={goBack}
              variant="outline"
              className="h-12 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-black dark:hover:bg-gray-100 font-semibold transition-colors" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {dictionary.common.loading}
                </span>
              ) : (
                dictionary.auth?.verifyAndLogin || 'Verify & Login'
              )}
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}
