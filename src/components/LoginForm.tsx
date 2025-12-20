'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

interface LoginFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function LoginForm({ dictionary, locale }: LoginFormProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '', twoFactorCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  const redirectUrl = useMemo(() => {
    return searchParams.get('redirect') || `/${locale}/dashboard`;
  }, [searchParams, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.email) {
        setError(dictionary.auth?.emailRequired || dictionary.errors.validationError);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(dictionary.auth?.invalidEmail || dictionary.errors.validationError);
        return;
      }

      if (!needsTwoFactor && !formData.password) {
        setError(dictionary.errors.validationError);
        return;
      }

      if (needsTwoFactor) {
        const verifyResponse = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            code: formData.twoFactorCode,
          }),
        });

        if (!verifyResponse.ok) {
          const verifyData = await verifyResponse.json().catch(() => ({}));
          setError(verifyData.error || dictionary.errors.serverError);
          return;
        }

        window.location.href = redirectUrl;
        return;
      }

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
        if (data.requiresTwoFactor) {
          setNeedsTwoFactor(true);
          return;
        }
        
        setError(data.error || dictionary.errors.serverError);
        return;
      }

      // Note: rememberMe is UI-only for now; session persistence is controlled server-side.
      void rememberMe;

      // Force a full page reload to ensure cookie is available.
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError(dictionary.errors.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
          <ShieldCheck className="h-4 w-4" />
          <span>{dictionary.auth?.loginSubtitle || dictionary.auth.login}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="hidden sm:flex items-center gap-2 text-xs text-white/60"
        >
          <Sparkles className="h-4 w-4" />
          <span>{dictionary.common?.loading ? dictionary.common.loading.replace(/\.$/, '') : 'Ready'}</span>
        </motion.div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-white/90">
          {dictionary.common.email}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/45" />
          <Input
            id="email"
            type="email"
            placeholder={dictionary.auth.emailPlaceholder}
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            autoComplete="email"
            required
            className="h-12 pl-10 bg-black/30 border-white/10 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:border-white/20"
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!needsTwoFactor ? (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="password" className="text-sm font-semibold text-white/90">
              {dictionary.common.password}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/45" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={dictionary.auth.passwordPlaceholder}
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                required
                className="h-12 pl-10 pr-11 bg-black/30 border-white/10 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:border-white/20"
              />
              <motion.button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-content-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="twoFactor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="twoFactorCode" className="text-sm font-semibold text-white/90">
              {dictionary.auth?.verificationCode || 'Verification Code'}
            </Label>
            <Input
              id="twoFactorCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={formData.twoFactorCode}
              onChange={(e) => setFormData((p) => ({ ...p, twoFactorCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              required
              className="h-12 text-center text-xl font-mono tracking-[0.35em] bg-black/30 border-white/10 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:border-white/20"
            />
            <div className="text-xs text-white/55">
              {dictionary.auth?.twoFactorDescription || 'Enter the verification code from your authenticator app'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-white/80">
          <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(Boolean(v))} />
          <span>{dictionary.common?.rememberMe || 'Remember me'}</span>
        </label>

        <Link
          href={`/${locale}/auth/forgot-password`}
          className="text-sm font-semibold text-white/85 hover:text-white hover:underline"
        >
          {dictionary.auth.forgotPassword}
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {error ? (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
            <p className="text-sm text-red-100/90">{error}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-3">
        <Button
          asChild
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-wide"
        >
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-black/70 border-t-transparent"
                />
                {dictionary.common.loading}
              </span>
            ) : needsTwoFactor ? (
              dictionary.auth?.verifyAndLogin || 'Verify & Login'
            ) : (
              dictionary.auth.loginButton
            )}
          </motion.button>
        </Button>

        <div className="text-center text-sm text-white/70">
          <span>{dictionary.auth.noAccount}</span>{' '}
          <Link href={`/${locale}/auth/register`} className="font-bold text-white hover:underline">
            {dictionary.auth.createAccount}
          </Link>
        </div>
      </div>
    </motion.form>
  );
}
