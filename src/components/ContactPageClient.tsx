
'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type SessionUser = { fullName?: string; email: string; role?: string };

export default function ContactPageClient({
  dictionary,
  locale,
  user,
}: {
  dictionary: Dictionary;
  locale: Locale;
  user?: SessionUser | null;
}) {
  const email = dictionary.pages.contact.info.email;
  const phone = dictionary.pages.contact.info.phone;
  const address = dictionary.pages.contact.info.address;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header dictionary={dictionary} locale={locale} user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-4 pt-16 pb-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-black" />
            <motion.div
              className="absolute -top-48 -left-48 h-120 w-120 rounded-full bg-blue-500/12 blur-3xl"
              animate={{ scale: [1, 1.12, 1], opacity: [0.28, 0.6, 0.28] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-56 -right-56 h-136 w-136 rounded-full bg-purple-500/12 blur-3xl"
              animate={{ scale: [1, 1.14, 1], opacity: [0.25, 0.58, 0.25] }}
              transition={{ duration: 7.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.06]" />
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
              className="text-4xl md:text-6xl font-black text-white"
            >
              {dictionary.pages.contact.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 text-lg md:text-xl text-gray-300"
            >
              {dictionary.pages.contact.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-6"
            >
              <Card className="relative overflow-hidden border border-white/10 bg-white/5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.12),transparent_60%)]" />
                <CardHeader className="relative">
                  <CardTitle className="text-2xl font-black text-white">{dictionary.pages.contact.info.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <Link
                    href={`mailto:${email}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-black/30 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/80">{dictionary.pages.contact.info.emailLabel}</div>
                      <div className="text-base font-bold text-white truncate">{email}</div>
                    </div>
                  </Link>

                  <Link
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-black/30 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-purple-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/80">{dictionary.pages.contact.info.phoneLabel}</div>
                      <div className="text-base font-bold text-white truncate">{phone}</div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-pink-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/80">{dictionary.pages.contact.info.addressLabel}</div>
                      <div className="text-base font-bold text-white truncate">{address}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="lg:col-span-7"
            >
              <Card className="relative overflow-hidden border border-white/10 bg-white/5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(236,72,153,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.12),transparent_60%)]" />
                <CardHeader className="relative">
                  <CardTitle className="text-2xl font-black text-white">{dictionary.pages.contact.form.submit}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ContactForm dictionary={dictionary} locale={locale} />
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