'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { BarChart3, Target, TrendingUp, Award, Sparkles, MapPin, Users } from 'lucide-react';

type SessionUser = {
  fullName?: string;
  email: string;
  role?: string;
};

interface AboutPageClientProps {
  dictionary: Dictionary;
  locale: Locale;
  user?: SessionUser | null;
}

export default function AboutPageClient({ dictionary, locale, user }: AboutPageClientProps) {
  const d = dictionary.pages.about;

  const systemCards = [
    {
      icon: Target,
      title: d.system.gamification.title,
      description: d.system.gamification.description,
      color: 'blue',
    },
    {
      icon: Users,
      title: d.system.athleticProfile.title,
      description: d.system.athleticProfile.description,
      color: 'purple',
    },
    {
      icon: TrendingUp,
      title: d.system.progressTracking.title,
      description: d.system.progressTracking.description,
      color: 'pink',
    },
    {
      icon: Award,
      title: d.system.rewardSystem.title,
      description: d.system.rewardSystem.description,
      color: 'green',
    },
  ];

  // Floating particles for background
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 15 + Math.random() * 10,
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header dictionary={dictionary} locale={locale} user={user} />

      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative px-4 pt-24 pb-16 overflow-hidden">
          {/* Background layers */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-black" />
            <motion.div
              className="absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-10" />

            {/* Floating particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full bg-white/20"
                style={{ left: particle.left, top: particle.top }}
                animate={{
                  y: [-20, 20],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6"
            >
              <motion.div
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }}
              >
                <Sparkles className="h-4 w-4 text-blue-300" />
              </motion.div>
              <span className="text-sm font-semibold text-white/90">{d.mission.title}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 260, damping: 24, delay: 0.05 }}
              className="text-4xl md:text-6xl font-black tracking-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {d.title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="mt-4 text-lg md:text-xl text-gray-300 mx-auto max-w-3xl leading-relaxed"
            >
              {d.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Origin Story */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.10),transparent_55%)]" />
                <CardHeader className="relative">
                  <CardTitle className="text-2xl md:text-3xl font-black text-white">
                    {d.origin.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative text-gray-300 leading-relaxed text-lg">
                  {d.origin.description}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Mission & Team */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(236,72,153,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(96,165,250,0.12),transparent_55%)]" />
                <CardHeader className="relative">
                  <CardTitle className="text-2xl md:text-3xl font-black text-white">
                    {d.mission.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative text-gray-300 leading-relaxed">
                  {d.mission.description}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              <Card className="relative h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl group">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.12),transparent_55%)]" />
                <CardContent className="relative h-full flex flex-col items-center justify-center p-10 space-y-6">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-3"
                  >
                    <MapPin className="h-14 w-14 text-green-400" />
                    <div className="text-xl font-black text-white text-center">{d.team.title}</div>
                    <div className="text-base text-gray-400 text-center">{d.team.location}</div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* System */}
        <section className="px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white">{d.system.title}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="h-full group"
                >
                  <Card className="relative h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                    <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-600/10`} />
                    <CardHeader className="relative">
                      <div className="flex items-start gap-4">
                        <motion.div
                          animate={{ rotate: [0, -4, 4, -4, 0] }}
                          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.2 }}
                          className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 border border-${item.color}-500/30 flex items-center justify-center flex-shrink-0`}
                        >
                          <item.icon className={`h-7 w-7 text-${item.color}-400`} />
                        </motion.div>
                        <div className="min-w-0">
                          <CardTitle className="text-xl font-extrabold text-white">{item.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative text-gray-300 leading-relaxed">
                      {item.description}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Approach */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.12),transparent_55%)]" />
                <CardHeader className="relative">
                  <CardTitle className="text-2xl md:text-3xl font-black text-white">
                    {d.approach.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative text-gray-300 leading-relaxed text-lg">
                  {d.approach.description}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
