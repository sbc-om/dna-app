
'use client';

import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { GroupTrainingDays } from '@/lib/trainingDays/trainingDaysTypes';

type Props = {
  locale: Locale;
  dictionary: Dictionary;
  groups: string[];
  initialRecords: GroupTrainingDays[];
};

export function TrainingDaysClient(_: Props) {
  // This dashboard feature has been removed.
  return null;
}
