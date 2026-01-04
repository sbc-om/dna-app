'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import {
  Target,
  Trophy,
  Zap,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Activity,
  Medal,
  BarChart3,
  Shield,
  Rocket
} from 'lucide-react';

type SessionUser = {
  email: string;
  role?: string;
  fullName?: string;
};

interface NewHomePageProps {
  dictionary: Dictionary;
  locale: Locale;
  user?: SessionUser | null;
}

export default function NewHomePage({ dictionary, locale, user }: NewHomePageProps) {
  const d = dictionary.pages.home;

  // Floating particles for background
  const particles = Array.from({ length: 20 }, (_, i) => ({
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
        {/* Hero Section */}
        <section className="relative px-4 pt-24 pb-20 overflow-hidden">
          {/* Animated Background */}
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
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[28px_28px]" />
            
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

          <div className="mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Sparkles className="h-5 w-5 text-blue-400" />
              </motion.div>
              <span className="text-sm font-bold text-white/90">{d.hero.badge}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
            >
              <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {d.hero.title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-gray-300 mx-auto max-w-3xl leading-relaxed"
            >
              {d.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href={`/${locale}/contact`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="relative overflow-hidden bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-blue-500/30 group">
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="relative flex items-center gap-2">
                      {d.hero.cta}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>
                </motion.div>
              </Link>

              {!user && (
                <Link href={`/${locale}/auth/login`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-6 rounded-2xl backdrop-blur-xl">
                      {d.hero.loginCta}
                    </Button>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">{d.intro.title}</h2>
              <p className="text-lg text-gray-300 leading-relaxed">{d.intro.description}</p>
            </motion.div>
          </div>
        </section>

        {/* What Sets Apart Section */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white">{d.whatSetsApart.title}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { ...d.whatSetsApart.point1, icon: Target, color: 'blue' },
                { ...d.whatSetsApart.point2, icon: BarChart3, color: 'purple' },
                { ...d.whatSetsApart.point3, icon: Trophy, color: 'pink' },
                { ...d.whatSetsApart.point4, icon: Shield, color: 'green' },
              ].map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative group"
                >
                  <motion.div
                    className={`absolute inset-0 bg-linear-to-br from-${point.color}-500/20 to-${point.color}-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <Card className="relative h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                    <CardContent className="p-6 space-y-4">
                      <motion.div
                        animate={{ rotate: [0, -5, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        className={`w-14 h-14 rounded-2xl bg-linear-to-br from-${point.color}-500/20 to-${point.color}-600/20 border border-${point.color}-500/30 flex items-center justify-center`}
                      >
                        <point.icon className={`h-7 w-7 text-${point.color}-400`} />
                      </motion.div>
                      <h3 className="text-xl font-black text-white">{point.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{point.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">{d.howItWorks.title}</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">{d.howItWorks.subtitle}</p>
            </motion.div>

            <div className="mt-16 space-y-6">
              {[
                { ...d.howItWorks.stage1, icon: Activity },
                { ...d.howItWorks.stage2, icon: Users },
                { ...d.howItWorks.stage3, icon: Target },
                { ...d.howItWorks.stage4, icon: TrendingUp },
                { ...d.howItWorks.stage5, icon: Medal },
              ].map((stage, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative group"
                >
                  <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                          className="shrink-0 w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                          <span className="text-2xl font-black text-white">{stage.number}</span>
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-white mb-3">{stage.title}</h3>
                          <p className="text-gray-300 leading-relaxed">{stage.description}</p>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
                        >
                          <stage.icon className="h-10 w-10 text-blue-400" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Assurance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12"
            >
              <Card className="border border-green-500/30 bg-green-500/5 backdrop-blur-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                    {d.howItWorks.assurance.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      d.howItWorks.assurance.point1,
                      d.howItWorks.assurance.point2,
                      d.howItWorks.assurance.point3,
                    ].map((point, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                        <span className="text-white font-semibold">{point}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Value for Institutions Section */}
        <section className="px-4 py-20 bg-white/2">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white">{d.valueForInstitutions.title}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { ...d.valueForInstitutions.continuity, icon: TrendingUp, color: 'blue' },
                { ...d.valueForInstitutions.progressClarity, icon: BarChart3, color: 'purple' },
                { ...d.valueForInstitutions.storytelling, icon: Star, color: 'pink' },
                { ...d.valueForInstitutions.brandinglegacy, icon: Award, color: 'yellow' },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <Card className="h-full relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl group">
                    <div className={`pointer-events-none absolute inset-0 bg-linear-to-br from-${value.color}-500/10 to-${value.color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <motion.div
                          animate={{ rotate: [0, -5, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                          className={`w-14 h-14 rounded-2xl bg-linear-to-br from-${value.color}-500/20 to-${value.color}-600/20 border border-${value.color}-500/30 flex items-center justify-center`}
                        >
                          <value.icon className={`h-7 w-7 text-${value.color}-400`} />
                        </motion.div>
                        <CardTitle className="text-2xl font-black text-white">{value.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 leading-relaxed">{value.description}</p>
                      {'results' in value && value.results && value.results.length > 0 && (
                        <div className="space-y-2">
                          {value.results.map((result: string, i: number) => (
                            <motion.div
                              key={i}
                              whileHover={{ x: 5 }}
                              className="flex items-center gap-2 text-sm text-gray-400"
                            >
                              <CheckCircle2 className={`h-4 w-4 text-${value.color}-400`} />
                              <span>{result}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Model Section */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">{d.partnershipModel.title}</h2>
              <p className="text-lg text-gray-300">{d.partnershipModel.subtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-full border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black text-white">{d.partnershipModel.howWeWork.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">{d.partnershipModel.howWeWork.description}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-full border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black text-white">{d.partnershipModel.structure.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-400" />
                      <span className="text-gray-300">{d.partnershipModel.structure.point1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-400" />
                      <span className="text-gray-300">{d.partnershipModel.structure.point2}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Who For */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <Card className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white">{d.partnershipModel.whoFor.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      d.partnershipModel.whoFor.type1,
                      d.partnershipModel.whoFor.type2,
                      d.partnershipModel.whoFor.type3,
                    ].map((type, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <Rocket className="h-6 w-6 text-blue-400 shrink-0" />
                          <span className="text-white font-semibold">{type}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Link href={`/${locale}/contact`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold px-10 py-6 rounded-2xl shadow-2xl shadow-purple-500/40 group">
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-pink-600 via-purple-600 to-blue-600"
                      animate={{ x: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="relative flex items-center gap-3">
                      <Sparkles className="h-6 w-6" />
                      {d.partnershipModel.cta}
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
