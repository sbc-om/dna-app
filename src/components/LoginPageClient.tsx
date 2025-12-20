'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { LoginForm } from '@/components/LoginForm';

interface LoginPageClientProps {
  dictionary: Dictionary;
  locale: Locale;
}

export default function LoginPageClient({ dictionary, locale }: LoginPageClientProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => {
        // Deterministic pseudo-random layout (avoids hydration mismatch)
        const x = (i * 37) % 100;
        const y = (i * 53) % 100;
        const size = 6 + ((i * 11) % 10);
        const delay = (i % 6) * 0.3;
        const duration = 3.6 + (i % 7) * 0.35;
        return { id: i, x, y, size, delay, duration };
      }),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05050b]">
      {/* Animated gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-40 -left-32 h-136 w-136 rounded-full bg-linear-to-br from-blue-600/25 via-purple-600/15 to-transparent blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-44 -right-36 h-144 w-xl rounded-full bg-linear-to-tr from-[#FF5F02]/22 via-pink-500/12 to-transparent blur-3xl"
          animate={{ scale: [1, 1.06, 1], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 7.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[48px_48px]" />

        {/* Particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full bg-white/20"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.12, 0.35, 0.12], scale: [0.9, 1.25, 0.9], y: [0, -12, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Scanline */}
        <motion.div
          className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/10 to-transparent opacity-15"
          animate={{ y: ['-10%', '120%'] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full"
        >
          <div className="mb-6 flex items-center justify-between">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/85">
              <motion.span
                whileHover={{ x: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <ArrowLeft className="h-5 w-5" />
                {dictionary.nav.home}
              </motion.span>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" />
              <span>{dictionary.auth.login}</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Left hero */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="hidden lg:block"
            >
              <motion.div
                whileHover={{ rotateY: -5, rotateX: 4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: -2, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      className="h-14 w-14 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Image src="/logo.png" alt="DNA" width={40} height={40} priority />
                    </motion.div>
                    <div className="text-white">
                      <div className="text-sm font-semibold text-white/70">DNA</div>
                      <div className="text-2xl font-black tracking-tight">{dictionary.auth.loginTitle}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-medium text-white/70">{dictionary.auth.loginSubtitle}</p>

                  <div className="mt-7 grid gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <Zap className="h-5 w-5 text-white/80" />
                      <div className="text-sm text-white/80">{dictionary.nav.dashboard}</div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <Sparkles className="h-5 w-5 text-white/80" />
                      <div className="text-sm text-white/80">{dictionary.nav.analytics}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full"
            >
              <motion.div
                whileHover={{ rotateY: 4, rotateX: 3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="transform-3d"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                  <div className="pointer-events-none absolute inset-0">
                    <motion.div
                      className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-linear-to-br from-[#FF5F02]/20 via-purple-500/10 to-transparent blur-3xl"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.7, 0.35] }}
                      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-linear-to-tr from-blue-500/18 via-[#FF5F02]/10 to-transparent blur-3xl"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.28, 0.62, 0.28] }}
                      transition={{ duration: 6.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>

                  <CardHeader className="relative border-b border-white/10 px-6 py-7">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 2, scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className="h-12 w-12 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Image src="/logo.png" alt="DNA" width={34} height={34} priority />
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl font-black tracking-tight text-white">
                          {dictionary.auth.loginTitle}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-white/65">
                          {dictionary.auth.loginSubtitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative px-6 py-6">
                    <Suspense
                      fallback={<div className="text-center text-sm text-white/60">{dictionary.common.loading}</div>}
                    >
                      <LoginForm dictionary={dictionary} locale={locale} />
                    </Suspense>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
