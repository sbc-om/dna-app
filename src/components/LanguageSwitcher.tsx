
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Locale, locales, localeNames } from '@/config/i18n';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
  /** Render as a full-width menu item button (useful inside dropdowns). */
  fullWidth?: boolean;
  className?: string;
};

export function LanguageSwitcher({ fullWidth, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/');
    const localeSegment = segments[1];
    return (locales.includes(localeSegment as Locale) ? localeSegment : 'en') as Locale;
  };

  const currentLocale = getCurrentLocale();
  
  // Get the other locale (not current)
  const otherLocale = locales.find(l => l !== currentLocale) || 'en';

  const switchLocale = () => {
    const segments = pathname.split('/');
    const currentLocaleInPath = locales.includes(segments[1] as Locale);

    let newPathname: string;
    if (currentLocaleInPath) {
      segments[1] = otherLocale;
      newPathname = segments.join('/');
    } else {
      newPathname = `/${otherLocale}${pathname}`;
    }

    router.push(newPathname);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(fullWidth ? 'w-full' : undefined, className)}
    >
      <Button 
        variant="ghost" 
        size="sm"
        onClick={switchLocale}
        className={cn(
          'h-11 gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all backdrop-blur-xl',
          fullWidth ? 'w-full justify-between px-3' : undefined
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Languages className="h-5 w-5 text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            {localeNames[otherLocale]}
          </span>
        </div>

        {fullWidth && (
          <span className="text-xs font-semibold text-white/70">
            {currentLocale.toUpperCase()} → {otherLocale.toUpperCase()}
          </span>
        )}
      </Button>
    </motion.div>
  );
}
