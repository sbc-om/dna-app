'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { getDictionary, type Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProgramsSlider } from '@/components/ProgramsSlider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Target, 
  Trophy, 
  Zap, 
  Award, 
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type SessionUser = {
  email: string;
  role?: string;
  fullName?: string;
};

export default function HomePage({ params }: PageProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState('');

  // Motion scroll-linked animations (per motion.dev scroll animations docs)
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const heroTitleY = useTransform(scrollYProgress, [0, 0.35], [0, -28]);
  const heroGlowY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const heroGlowRotate = useTransform(scrollYProgress, [0, 1], [0, 35]);
  const heroGlowOpacity = useTransform(scrollYProgress, [0, 0.25, 1], [0.45, 0.25, 0.05]);

  const progressOriginX = useMemo(() => (locale === 'ar' ? 1 : 0), [locale]);

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      const loc = resolvedParams.locale as Locale;
      setLocale(loc);
      
      const dict = await getDictionary(loc);
      setDictionary(dict);

      // Fetch current user
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data: unknown = await response.json();
          if (data && typeof data === 'object' && 'user' in data) {
            const maybeUser = (data as { user?: unknown }).user;
            if (maybeUser && typeof maybeUser === 'object') {
              const u = maybeUser as Record<string, unknown>;
              const email = typeof u.email === 'string' ? u.email : null;
              if (email) {
                const role = typeof u.role === 'string' ? u.role : undefined;
                const fullName =
                  typeof u.fullName === 'string'
                    ? u.fullName
                    : typeof u.name === 'string'
                      ? u.name
                      : undefined;
                setUser({ email, role, fullName });
              }
            }
          }
        }
      } catch {
        // Ignore
      }
    }
    loadData();
  }, [params]);

  if (!dictionary) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const programs = [
    {
      title: 'FOOTBALL',
      description: 'Professional football training program for all skill levels',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop'
    },
    {
      title: 'BASKETBALL',
      description: 'Elite basketball development and skills training',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop'
    },
    {
      title: 'VOLLEYBALL',
      description: 'Comprehensive volleyball training and team development',
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop'
    },
    {
      title: 'YOUTH PROGRAM',
      description: 'Building tomorrow\'s champions through structured training',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop'
    }
  ];

  const testimonials = [
    {
      name: 'John Doe',
      role: 'Parent',
      content: 'Amazing program! My son has improved significantly in both skills and confidence.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
    },
    {
      name: 'Sarah Smith',
      role: 'Athlete',
      content: 'The coaching staff is exceptional and truly cares about each athlete. Highly recommend!',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
    },
    {
      name: 'Mike Johnson',
      role: 'Coach',
      content: 'Best sports academy in the region. Great facilities and amazing community!',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
    }
  ];

  const faqs = [
    { q: dictionary.pages.home.faq.q1, a: dictionary.pages.home.faq.a1 },
    { q: dictionary.pages.home.faq.q2, a: dictionary.pages.home.faq.a2 },
    { q: dictionary.pages.home.faq.q3, a: dictionary.pages.home.faq.a3 },
    { q: dictionary.pages.home.faq.q4, a: dictionary.pages.home.faq.a4 }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header dictionary={dictionary} locale={locale} user={user} />

      {/* Scroll progress indicator (scroll-linked) */}
      <div className="fixed top-0 left-0 right-0 z-60 pointer-events-none">
        <div className="h-1.5 bg-white/5 backdrop-blur-xl">
          <motion.div
            className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
            style={{ scaleX: progressScaleX, transformOrigin: progressOriginX === 1 ? 'right' : 'left' }}
          />
        </div>
      </div>
      
      <main className="overflow-hidden">
        {/* Intro section (no hero image, no background glow) */}
        <section className="relative py-16 px-4 overflow-hidden">
          {/* Parallax glow accents (scroll-linked) */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.35),transparent_60%)] blur-3xl"
            style={{ y: heroGlowY, rotate: heroGlowRotate, opacity: heroGlowOpacity }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 -right-48 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.28),transparent_60%)] blur-3xl"
            style={{ y: heroGlowY, rotate: heroGlowRotate, opacity: heroGlowOpacity }}
          />
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              <motion.div variants={itemVariants} className="lg:col-span-7">
                <div className="relative group h-full">
                  <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.18),transparent_55%)] blur-2xl" />
                  <div className="relative h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6">
                      <Sparkles className="w-4 h-4 text-blue-300" />
                      <span className="text-sm font-semibold text-white/90">Discover Your Natural Ability</span>
                    </div>

                    <motion.h1
                      style={{ y: heroTitleY }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-white"
                    >
                      {dictionary.pages.home.hero.title}
                    </motion.h1>
                    <p className="mt-5 text-gray-300 font-medium leading-relaxed text-base sm:text-lg max-w-2xl">
                      {dictionary.pages.home.hero.subtitle}
                    </p>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                      <Link href={`/${locale}/book-appointment`} className="w-full sm:w-auto">
                        <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="lg"
                            className="w-full sm:w-auto h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 border border-blue-400/30"
                          >
                            <span className="flex items-center">
                              {dictionary.pages.home.hero.cta}
                              <ArrowRight className="ml-2 w-5 h-5" />
                            </span>
                          </Button>
                        </motion.div>
                      </Link>

                      {user ? (
                        <Link href={`/${locale}/dashboard`} className="w-full sm:w-auto">
                          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              size="lg"
                              variant="outline"
                              className="w-full sm:w-auto h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10"
                            >
                              {dictionary.nav.dashboard}
                              <ChevronRight className="ml-2 w-5 h-5" />
                            </Button>
                          </motion.div>
                        </Link>
                      ) : (
                        <Link href={`/${locale}/auth/login`} className="w-full sm:w-auto">
                          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              size="lg"
                              variant="outline"
                              className="w-full sm:w-auto h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10"
                            >
                              {dictionary.pages.home.hero.loginCta}
                              <ChevronRight className="ml-2 w-5 h-5" />
                            </Button>
                          </motion.div>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 h-full">
                  {[
                    { icon: Users, label: '500+', sublabel: 'Athletes' },
                    { icon: Trophy, label: '50+', sublabel: 'Champions' },
                    { icon: Star, label: '4.9', sublabel: 'Rating' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative group"
                    >
                      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.20),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(96,165,250,0.18),transparent_55%)] blur-2xl" />
                      <div className="relative rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-xl">
                        <stat.icon className="w-6 h-6 text-blue-300 mb-3" />
                        <div className="text-3xl font-black text-white">{stat.label}</div>
                        <div className="text-sm text-gray-400">{stat.sublabel}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose DNA?
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Discover your natural abilities with our cutting-edge assessment system
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Target, title: 'Precision Assessment', desc: 'Advanced AI-powered analysis of physical abilities', color: 'from-blue-500 to-cyan-500' },
                { icon: Trophy, title: 'Track Progress', desc: 'Monitor development with detailed performance metrics', color: 'from-purple-500 to-pink-500' },
                { icon: Zap, title: 'Instant Feedback', desc: 'Real-time insights and personalized recommendations', color: 'from-orange-500 to-red-500' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl blur-2xl transition-opacity`} />
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors h-full">
                    <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-24 px-4 bg-[#1a1a1a] overflow-hidden">
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600/20 to-purple-600/20 text-blue-300 px-5 py-2.5 rounded-full mb-6 border border-blue-500/30"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-bold">HOW IT WORKS</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black mb-6 bg-linear-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Your Journey to Excellence
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform your potential into measurable performance through our scientifically-proven 3-step process
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: '01',
                  icon: Target,
                  title: 'Assessment',
                  description: 'Comprehensive analysis of your natural physical abilities using advanced testing protocols',
                  color: 'from-blue-500 to-cyan-500',
                  delay: 0
                },
                {
                  step: '02',
                  icon: Activity,
                  title: 'Development',
                  description: 'Personalized training program designed to enhance your strengths and improve weaknesses',
                  color: 'from-purple-500 to-pink-500',
                  delay: 0.2
                },
                {
                  step: '03',
                  icon: Trophy,
                  title: 'Achievement',
                  description: 'Track progress, earn badges, and advance through performance stages to reach your peak',
                  color: 'from-orange-500 to-red-500',
                  delay: 0.4
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  {/* Step number circle */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-16 h-16 rounded-full bg-linear-to-br ${item.color} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-2xl font-black text-white">{item.step}</span>
                    </motion.div>
                  </div>

                  {/* Card */}
                  <div className="relative mt-10 group">
                    <div className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-3xl blur-2xl transition-opacity`} />
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/30 transition-all h-full">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-center mt-16"
            >
              <Link href={`/${locale}/book-appointment`}>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="h-14 rounded-2xl bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold px-10 border-2 border-blue-500/50 hover:border-blue-400 shadow-lg shadow-blue-600/50 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center text-lg">
                      Start Your Journey
                      <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Programs Section - Animated Slider */}
        <ProgramsSlider dictionary={dictionary} locale={locale} programs={programs} />

        {/* Recognition Section - Simplified */}
        <section className="relative py-24 px-4 bg-[#0f0f0f] overflow-hidden">
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {dictionary.pages.home.recognition.title}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                {dictionary.pages.home.recognition.subtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, title: dictionary.pages.home.recognition.point1, color: 'from-blue-500 to-cyan-500' },
                { icon: Trophy, title: dictionary.pages.home.recognition.point2, color: 'from-purple-500 to-pink-500' },
                { icon: Zap, title: dictionary.pages.home.recognition.point3, color: 'from-orange-500 to-red-500' },
                { icon: Award, title: dictionary.pages.home.recognition.point4, color: 'from-green-500 to-emerald-500' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="relative group"
                >
                    <div className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity`} />
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all text-center">
                      <div className={`w-16 h-16 rounded-xl bg-linear-to-br ${item.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - Removed for cleaner design */}

        {/* FAQ Section - Simplified */}
        <section className="relative py-24 px-4 bg-[#1a1a1a] overflow-hidden">
          <div className="max-w-4xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {dictionary.pages.home.faq.title}
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="group"
                >
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      {faq.q}
                    </h3>
                    <p className="text-gray-400 ml-9 leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats & Achievements Section */}
        <section className="relative py-24 px-4 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 border-2 border-white/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-64 h-64 border-2 border-white/20 rounded-full"
            />
          </div>

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl text-white px-5 py-2.5 rounded-full mb-6 border border-white/30"
              >
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-bold">OUR ACHIEVEMENTS</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                Building Champions
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of athletes who have discovered their potential
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { number: '5000+', label: 'Athletes Trained', icon: Users },
                { number: '150+', label: 'Champions Created', icon: Trophy },
                { number: '98%', label: 'Success Rate', icon: TrendingUp },
                { number: '25+', label: 'Years Experience', icon: Award },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/40 transition-all">
                    <stat.icon className="w-10 h-10 md:w-12 md:h-12 text-white mb-4 mx-auto group-hover:scale-110 transition-transform" />
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.5, type: 'spring' }}
                      className="text-3xl md:text-5xl font-black text-white mb-2"
                    >
                      {stat.number}
                    </motion.div>
                    <p className="text-sm md:text-base text-white/80 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-center mt-16"
            >
              <Link href={`/${locale}/book-appointment`}>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="h-16 rounded-2xl bg-white text-purple-600 font-bold px-12 hover:bg-white/90 shadow-2xl shadow-black/30 text-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center">
                      Become a Champion
                      <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
