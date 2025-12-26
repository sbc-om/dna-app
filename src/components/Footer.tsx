'use client';

import Link from 'next/link';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Instagram, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

interface FooterProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function Footer({ dictionary, locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 24 }}
      className="relative bg-black border-t border-white/10 pb-20 md:pb-0 overflow-hidden"
    >
      {/* Dark-only background (avoid gradients to prevent initial color flash). */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.08]" />
      </div>

      {/* Top separator line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-start">
          {/* Brand */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="relative"
              >
                <img src="/logo-white.png" alt="DNA Logo" className="h-12 w-auto object-contain" />
              </motion.div>

              <div className="min-w-0">
                <div className="text-lg font-black text-white truncate">
                  {dictionary.common.appName}
                </div>
                <div className="text-sm text-white/70">
                  {dictionary.footer.tagline}
                </div>
              </div>
            </Link>
          </div>

          {/* Links */}
          <div className="md:justify-self-center">
            <div className="text-xs font-bold tracking-wider text-white/70 mb-3">
              {dictionary.footer.quickLinks}
            </div>
            <nav className="flex flex-wrap gap-2">
              {[
                { href: `/${locale}`, label: dictionary.nav.home },
                { href: `/${locale}/about`, label: dictionary.nav.about },
                { href: `/${locale}/contact`, label: dictionary.nav.contact },
              ].map((item) => (
                <motion.div key={item.href} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-white/85 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="md:justify-self-end space-y-3">
            <div className="text-xs font-bold tracking-wider text-white/70">
              {dictionary.footer.followUs}
            </div>
            <div className="flex items-center gap-3">
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="h-11 w-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 text-white/80 hover:text-pink-300 transition-all flex items-center justify-center shadow-lg shadow-black/20"
                aria-label={dictionary.footer.instagram}
              >
                <Instagram className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="h-11 w-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/40 text-white/80 hover:text-sky-300 transition-all flex items-center justify-center shadow-lg shadow-black/20"
                aria-label={dictionary.footer.twitter}
              >
                <Twitter className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08, rotate: -1 }}
                whileTap={{ scale: 0.95 }}
                className="h-11 w-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-white/80 hover:text-amber-300 transition-all flex items-center justify-center shadow-lg shadow-black/20"
                aria-label={dictionary.footer.linkedin}
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/60">
            © {currentYear} {dictionary.common.appName}. {dictionary.footer.rights}
          </div>
          <div className="text-xs text-white/50">
            {dictionary.footer.madeForAthletes}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}