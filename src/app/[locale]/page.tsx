'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Target, 
  Trophy, 
  Users, 
  Zap, 
  Award, 
  ChevronRight,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function HomePage({ params }: PageProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [dictionary, setDictionary] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.8]);

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
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
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
    <div className="min-h-screen bg-background" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header dictionary={dictionary} locale={locale} user={user} />
      
      <main className="overflow-hidden">
        {/* Hero Section */}
        <motion.section 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[90vh] flex items-center justify-center px-4 py-20"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero.webp')" }}
          >
            {/* Dark Overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
            {/* Additional overlay for depth */}
            <div className="absolute inset-0 bg-[#FF5F02]/10"></div>
          </div>

          {/* Animated grid overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto text-center relative z-10"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <img 
                src="/logo.png" 
                alt="Logo"
                className="w-32 h-32 md:w-48 md:h-48 mx-auto object-contain drop-shadow-2xl"
              />
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-white drop-shadow-2xl leading-tight"
            >
              {dictionary.pages.home.hero.title}
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-3xl text-white font-semibold mb-12 max-w-3xl mx-auto drop-shadow-lg"
            >
              {dictionary.pages.home.hero.subtitle}
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href={`/${locale}/book-appointment`}>
                <Button size="lg" className="bg-[#FF5F02] hover:bg-white hover:text-[#FF5F02] text-white px-8 py-6 text-lg rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-transparent hover:border-[#FF5F02]">
                  {dictionary.pages.home.hero.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {user ? (
                <Link href={`/${locale}/dashboard`}>
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white hover:text-[#FF5F02] px-8 py-6 text-lg rounded-full shadow-lg transform hover:scale-110 transition-all duration-300">
                    {dictionary.nav.dashboard}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/${locale}/auth/login`}>
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white hover:text-[#FF5F02] px-8 py-6 text-lg rounded-full shadow-lg transform hover:scale-110 transition-all duration-300">
                    {dictionary.pages.home.hero.loginCta}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Partners Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-black mb-12 text-foreground">
                {dictionary.pages.home.partners.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
                {[
                  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=200&h=200&fit=crop'
                ].map((img, i) => (
                  <div key={i} className="flex items-center justify-center p-8 bg-background rounded-lg shadow-sm">
                    <img src={img} alt={`Partner ${i + 1}`} className="w-24 h-24 object-cover rounded-full grayscale hover:grayscale-0 transition-all" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-20 px-4 bg-white dark:bg-[#262626]">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-[#FF5F02] text-white px-4 py-2 rounded-full inline-block mb-4 text-sm font-bold">
                  {dictionary.pages.home.philosophy.badge}
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-4 text-foreground">
                  {dictionary.pages.home.philosophy.title}
                </h2>
                <p className="text-xl text-muted-foreground mb-6">
                  {dictionary.pages.home.philosophy.subtitle}
                </p>
                <div className="space-y-4">
                  <Card className="border-l-4 border-[#FF5F02]">
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold mb-2">{dictionary.pages.home.philosophy.description}</h3>
                      <p className="text-muted-foreground">{dictionary.pages.home.philosophy.goal}</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <img 
                  src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop" 
                  alt="Philosophy" 
                  className="w-full rounded-2xl shadow-2xl object-cover h-[500px]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section className="py-24 px-4 bg-[#DDDDDD] dark:bg-[#000000]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <div className="inline-block">
                <h2 className="text-5xl md:text-7xl font-black mb-6 text-[#262626] dark:text-white tracking-tight">
                  {dictionary.pages.home.programs.title}
                </h2>
                <div className="h-2 w-32 bg-[#FF5F02] mx-auto rounded-full mb-6"></div>
              </div>
              <p className="text-2xl md:text-3xl text-muted-foreground font-semibold max-w-3xl mx-auto">
                {dictionary.pages.home.programs.subtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {programs.map((program, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="h-full"
                >
                  <Card className="group h-full flex flex-col hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 hover:border-[#FF5F02] cursor-pointer hover:-translate-y-2">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className={`h-64 relative overflow-hidden`}>
                        <img 
                          src={program.image} 
                          alt={program.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                        />
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black mb-3 group-hover:text-[#FF5F02] transition-colors min-h-[3.5rem]">
                          {program.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 flex-1 text-base leading-relaxed">
                          {program.description}
                        </p>
                        <Button 
                          variant="ghost" 
                          className="w-full group-hover:bg-[#FF5F02] group-hover:text-white transition-all duration-300 py-6 text-base font-bold rounded-xl"
                        >
                          {dictionary.pages.home.programs.learnMore}
                          <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recognition Section */}
        <section className="py-20 px-4 bg-white dark:bg-[#262626]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-4">
                {dictionary.pages.home.recognition.title}
              </h2>
              <p className="text-2xl text-muted-foreground font-bold">
                {dictionary.pages.home.recognition.subtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, title: dictionary.pages.home.recognition.point1 },
                { icon: Trophy, title: dictionary.pages.home.recognition.point2 },
                { icon: Zap, title: dictionary.pages.home.recognition.point3 },
                { icon: Award, title: dictionary.pages.home.recognition.point4 }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="text-center p-8 hover:shadow-xl transition-all border-2 hover:border-[#FF5F02]">
                    <item.icon className="w-16 h-16 mx-auto mb-4 text-[#FF5F02]" />
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 bg-[#DDDDDD] dark:bg-[#000000]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-2">
                {dictionary.pages.home.testimonials.title}
              </h2>
              <p className="text-3xl font-bold text-muted-foreground">
                {dictionary.pages.home.testimonials.subtitle}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all">
                    <CardContent className="p-8">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                      />
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
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
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-2 flex items-start gap-2">
                        <CheckCircle2 className="w-6 h-6 text-[#FF5F02] shrink-0 mt-1" />
                        {faq.q}
                      </h3>
                      <p className="text-muted-foreground ml-8">{faq.a}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 px-4 bg-[#FF5F02]">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white text-[#FF5F02] px-4 py-2 rounded-full inline-block mb-4 text-sm font-bold">
                {dictionary.pages.home.newsletter.badge}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
                {dictionary.pages.home.newsletter.title}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                <Input 
                  type="email" 
                  placeholder={dictionary.pages.home.newsletter.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white border-0 text-lg py-6"
                />
                <Button size="lg" className="bg-[#262626] text-white hover:bg-[#000000] px-8 py-6 text-lg font-bold">
                  {dictionary.pages.home.newsletter.button}
                </Button>
              </div>
              <p className="text-white opacity-80 text-sm mt-4">
                {dictionary.pages.home.newsletter.privacy}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Discover Section */}
        <section className="py-20 px-4 bg-[#262626] text-white">
          <div className="max-w-7xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-6xl md:text-8xl font-black mb-12"
            >
              {dictionary.pages.home.discover.title}
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-8">
              {dictionary.pages.home.discover.sports.map((sport: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-2xl md:text-3xl font-bold text-white opacity-70 hover:opacity-100 hover:text-[#FF5F02] transition-colors cursor-pointer"
                >
                  {sport}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
