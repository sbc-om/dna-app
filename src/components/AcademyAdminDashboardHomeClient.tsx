'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Layers,
  ArrowUpRight,
  RefreshCcw,
  Filter,
  X,
  ChevronRight,
} from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PlayerStageKey } from '@/lib/player/stageSystem';

export type AcademyAdminPlayerRow = {
  userId: string;
  displayName: string;
  ageCategory: string;
  stage: PlayerStageKey;
  lastAssessmentAt?: string;
  needsReassessment: boolean;
  readyForStageUpgrade: boolean;
};

export type AcademyAdminDashboardData = {
  totalPlayers: number;
  stageCounts: Record<PlayerStageKey, number>;
  playersReadyForStageUpgrade: number;
  playersNeedingReassessment: number;
  groups: Array<{ key: string; count: number }>;
  players: AcademyAdminPlayerRow[];
};

type FilterFlag = 'all' | 'ready_upgrade' | 'needs_reassessment';

type Props = {
  locale: Locale;
  dictionary: Dictionary;
  data: AcademyAdminDashboardData;
};

function stageLabel(dictionary: Dictionary, stage: PlayerStageKey): string {
  const labels = dictionary.playerProfile?.stages;
  switch (stage) {
    case 'explorer':
      return labels?.explorer ?? 'Explorer';
    case 'foundation':
      return labels?.foundation ?? 'Foundation';
    case 'active_player':
      return labels?.activePlayer ?? 'Active Player';
    case 'competitor':
      return labels?.competitor ?? 'Competitor';
    case 'champion':
      return labels?.champion ?? 'Champion';
  }
}

function formatDate(locale: Locale, iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function AcademyAdminDashboardHomeClient({ locale, dictionary, data }: Props) {
  const [stageFilter, setStageFilter] = useState<PlayerStageKey | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<FilterFlag>('all');

  const filteredPlayers = useMemo(() => {
    return data.players.filter((p) => {
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
      if (groupFilter !== 'all' && p.ageCategory !== groupFilter) return false;
      if (flagFilter === 'ready_upgrade' && !p.readyForStageUpgrade) return false;
      if (flagFilter === 'needs_reassessment' && !p.needsReassessment) return false;
      return true;
    });
  }, [data.players, flagFilter, groupFilter, stageFilter]);

  const activeFiltersCount =
    (stageFilter !== 'all' ? 1 : 0) + (groupFilter !== 'all' ? 1 : 0) + (flagFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setStageFilter('all');
    setGroupFilter('all');
    setFlagFilter('all');
  };

  const cardBase =
    'relative overflow-hidden rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6';

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#262626] dark:text-white">
          {dictionary.dashboard?.academyAdmin?.homeTitle ?? 'Academy overview'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {dictionary.dashboard?.academyAdmin?.homeSubtitle ??
            'Understand academy status in 30 seconds: who needs attention and what to do next.'}
        </p>
      </motion.div>

      {/* Top section: summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setFlagFilter('all');
            setStageFilter('all');
            setGroupFilter('all');
          }}
          className={cardBase + ' text-left'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {dictionary.dashboard?.academyAdmin?.totalPlayers ?? 'Total players'}
              </div>
              <div className="mt-2 text-3xl font-black text-[#262626] dark:text-white">{data.totalPlayers}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {dictionary.dashboard?.academyAdmin?.clickToFilter ?? 'Click to filter'}
            <ChevronRight className="h-4 w-4" />
          </div>
        </motion.button>

        <div className={cardBase}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {dictionary.dashboard?.academyAdmin?.stageDistribution ?? 'Stage distribution'}
              </div>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ['explorer', data.stageCounts.explorer],
                    ['foundation', data.stageCounts.foundation],
                    ['active_player', data.stageCounts.active_player],
                    ['competitor', data.stageCounts.competitor],
                    ['champion', data.stageCounts.champion],
                  ] as Array<[PlayerStageKey, number]>
                ).map(([stage, count]) => (
                  <motion.button
                    key={stage}
                    type="button"
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setStageFilter(stage);
                      setFlagFilter('all');
                    }}
                    className={
                      'w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ' +
                      (stageFilter === stage
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5')
                    }
                  >
                    <span className="font-semibold text-[#262626] dark:text-white">{stageLabel(dictionary, stage)}</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">{count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Layers className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setFlagFilter('ready_upgrade');
            setStageFilter('all');
          }}
          className={cardBase + ' text-left'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {dictionary.dashboard?.academyAdmin?.readyForStageUpgrade ?? 'Players ready for stage upgrade'}
              </div>
              <div className="mt-2 text-3xl font-black text-[#262626] dark:text-white">
                {data.playersReadyForStageUpgrade}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
            {dictionary.dashboard?.academyAdmin?.clickToFilter ?? 'Click to filter'}
            <ChevronRight className="h-4 w-4" />
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setFlagFilter('needs_reassessment');
            setStageFilter('all');
          }}
          className={cardBase + ' text-left'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {dictionary.dashboard?.academyAdmin?.needingReassessment ?? 'Players needing reassessment'}
              </div>
              <div className="mt-2 text-3xl font-black text-[#262626] dark:text-white">
                {data.playersNeedingReassessment}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
              <RefreshCcw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
            {dictionary.dashboard?.academyAdmin?.clickToFilter ?? 'Click to filter'}
            <ChevronRight className="h-4 w-4" />
          </div>
        </motion.button>
      </div>

      {/* Middle section: groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#262626] dark:text-white">
              {dictionary.dashboard?.academyAdmin?.groupsTitle ?? 'Training groups'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {dictionary.dashboard?.academyAdmin?.groupsSubtitle ?? 'Navigate by age category (group-based).'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {dictionary.dashboard?.academyAdmin?.groupsCountLabel ?? 'Groups'}: {data.groups.length}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setGroupFilter('all')}
            className={
              'rounded-2xl border-2 p-4 text-left ' +
              (groupFilter === 'all'
                ? 'border-blue-500/60 bg-blue-500/10'
                : 'border-[#DDDDDD] dark:border-[#000000] bg-white/70 dark:bg-white/5')
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {dictionary.dashboard?.academyAdmin?.allGroups ?? 'All groups'}
                </div>
                <div className="mt-1 text-2xl font-black text-[#262626] dark:text-white">{data.totalPlayers}</div>
              </div>
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.button>

          {data.groups.map((g, idx) => (
            <motion.button
              key={g.key}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGroupFilter(g.key)}
              className={
                'rounded-2xl border-2 p-4 text-left ' +
                (groupFilter === g.key
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-[#DDDDDD] dark:border-[#000000] bg-white/70 dark:bg-white/5')
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{g.key}</div>
                  <div className="mt-1 text-2xl font-black text-[#262626] dark:text-white">{g.count}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom section: player list */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#262626] dark:text-white">
              {dictionary.dashboard?.academyAdmin?.playersTitle ?? 'Players'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {dictionary.dashboard?.academyAdmin?.playersSubtitle ?? 'Filtered player list based on the overview cards.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {dictionary.dashboard?.academyAdmin?.resultsLabel ?? 'Results'}: {filteredPlayers.length}
            </Badge>
            {activeFiltersCount > 0 && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button type="button" variant="outline" onClick={resetFilters} className="rounded-2xl">
                  <X className="h-4 w-4 mr-2" />
                  {dictionary.dashboard?.academyAdmin?.clearFilters ?? 'Clear filters'}
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5">
                <tr className="text-left">
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {dictionary.dashboard?.academyAdmin?.colPlayer ?? 'Player'}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {dictionary.dashboard?.academyAdmin?.colGroup ?? 'Group'}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {dictionary.dashboard?.academyAdmin?.colStage ?? 'Stage'}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {dictionary.dashboard?.academyAdmin?.colLastAssessment ?? 'Last assessment'}
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {dictionary.dashboard?.academyAdmin?.colStatus ?? 'Status'}
                  </th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredPlayers.map((p) => (
                    <motion.tr
                      key={p.userId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-black/10 dark:border-white/10"
                    >
                      <td className="p-4">
                        <div className="font-bold text-[#262626] dark:text-white">{p.displayName}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="rounded-full">
                          {p.ageCategory || (dictionary.dashboard?.academyAdmin?.groupUnassigned ?? 'Unassigned')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className="rounded-full" variant="outline">
                          {stageLabel(dictionary, p.stage)}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {formatDate(locale, p.lastAssessmentAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {p.readyForStageUpgrade && (
                            <Badge className="rounded-full bg-purple-600 text-white">{dictionary.dashboard?.academyAdmin?.statusReadyUpgrade ?? 'Ready upgrade'}</Badge>
                          )}
                          {p.needsReassessment && (
                            <Badge className="rounded-full bg-orange-600 text-white">{dictionary.dashboard?.academyAdmin?.statusNeedsReassessment ?? 'Needs reassessment'}</Badge>
                          )}
                          {!p.readyForStageUpgrade && !p.needsReassessment && (
                            <Badge variant="secondary" className="rounded-full">{dictionary.dashboard?.academyAdmin?.statusOk ?? 'OK'}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button asChild className="rounded-2xl">
                            <Link href={`/${locale}/dashboard/kids/${p.userId}`}>
                              {dictionary.dashboard?.academyAdmin?.viewProfile ?? 'View profile'}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredPlayers.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-gray-600 dark:text-gray-400 font-semibold">
                {dictionary.dashboard?.academyAdmin?.noResults ?? 'No players match the current filters.'}
              </p>
              {activeFiltersCount > 0 && (
                <div className="mt-4">
                  <Button type="button" variant="outline" onClick={resetFilters} className="rounded-2xl">
                    {dictionary.dashboard?.academyAdmin?.clearFilters ?? 'Clear filters'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
