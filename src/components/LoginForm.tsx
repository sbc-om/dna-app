'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

interface LoginFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function LoginForm({ dictionary, locale }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    console.log('🔐 Attempting login with:', formData.email);

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

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        console.error('❌ Login failed:', data.error);
        setError(data.error || dictionary.errors.serverError);
        return;
      }

      // Get redirect URL from query params or default to dashboard
      const redirectUrl = searchParams.get('redirect') || `/${locale}/dashboard`;
      console.log('✅ Login successful! Redirecting to:', redirectUrl);
      
      // Force a full page reload to ensure cookie is available
      // Using window.location instead of router.push to avoid cookie timing issues
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('💥 Login error:', err);
      setError(dictionary.errors.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Mail className="w-4 h-4 text-pink-500" />
          {dictionary.common.email}
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder={dictionary.auth.emailPlaceholder}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-11 text-base rounded-xl border-2 border-purple-300 dark:border-purple-600 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900/50 pl-10 transition-all"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-pink-500" />
          {dictionary.common.password}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            placeholder={dictionary.auth.passwordPlaceholder}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="h-11 text-base rounded-xl border-2 border-purple-300 dark:border-purple-600 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900/50 pl-10 transition-all"
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl animate-shake">
          <p className="text-red-800 dark:text-red-200 text-sm font-semibold text-center">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-11 text-base font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {dictionary.common.loading}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            {dictionary.auth.loginButton}
          </span>
        )}
      </Button>
    </form>
  );
}
