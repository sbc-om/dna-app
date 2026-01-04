'use client';

import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import NewHomePage from '@/components/NewHomePage';
import { useEffect, useState } from 'react';

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
  const [dictionary, setDictionary] = useState<any>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

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

  return <NewHomePage dictionary={dictionary} locale={locale} user={user} />;
}
