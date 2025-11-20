'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Locale, locales, localeNames } from '@/config/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/');
    const localeSegment = segments[1];
    return (locales.includes(localeSegment as Locale) ? localeSegment : 'en') as Locale;
  };

  const currentLocale = getCurrentLocale();

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/');
    const currentLocaleInPath = locales.includes(segments[1] as Locale);

    let newPathname: string;
    if (currentLocaleInPath) {
      segments[1] = newLocale;
      newPathname = segments.join('/');
    } else {
      newPathname = `/${newLocale}${pathname}`;
    }

    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-10 gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Languages className="h-5 w-5 text-[#30B2D2]" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentLocale.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((locale: Locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className={cn(
              "cursor-pointer gap-2 py-2.5",
              currentLocale === locale && 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold'
            )}
          >
            <Languages className="h-4 w-4" />
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
