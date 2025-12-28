
'use client';

import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PlayerActivation } from '@/lib/db/repositories/playerActivationRepository';

type Props = {
  locale: Locale;
  dictionary: Dictionary;
  initialActivations: PlayerActivation[];
  initialPlayers: Array<{ id: string; displayName: string }>;
};

export function ActivationsClient(_: Props) {
  // This dashboard feature has been removed.
  return null;
}
