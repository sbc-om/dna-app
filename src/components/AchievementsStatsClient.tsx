'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  Medal,
  Sparkles,
  ArrowLeft,
  Crown,
  Gift,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import type { User } from '@/lib/db/repositories/userRepository';
import type { PlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import type { DnaAssessmentSession } from '@/lib/db/repositories/dnaAssessmentRepository';
import { BADGES } from '@/lib/player/badges';
import { calculateCategoryScores } from '@/lib/player/dnaScoring';
import { DnaCircularGauge } from '@/components/DnaCircularGauge';
import { DEFAULT_ACCENT_COLOR } from '@/lib/theme/accentColors';

interface AchievementsStatsClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User;
  profile: PlayerProfile | null;
  latestAssessment?: DnaAssessmentSession | null;
  accentColor?: string;
}

export function AchievementsStatsClient({
  dictionary,
  locale,
  kid,
  profile,
  latestAssessment,
  accentColor,
}: AchievementsStatsClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    document.documentElement.style.setProperty('--dna-accent', accentColor || DEFAULT_ACCENT_COLOR);
    return () => {
      document.documentElement.style.removeProperty('--dna-accent');
    };
  }, [accentColor]);

  const t = (path: string): string => {
    const parts = path.split('.');
    let cur: unknown = dictionary;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return path;
      cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === 'string' ? cur : path;
  };

  const fallbackBadgeLabel = (badgeId: string): string =>
    badgeId
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const badgeName = (badgeId: string): string => {
    const def = BADGES.find((b) => b.id === badgeId);
    if (!def) return fallbackBadgeLabel(badgeId);
    const translated = t(def.nameKey);
    return translated === def.nameKey ? fallbackBadgeLabel(badgeId) : translated;
  };

  const categoryLabel = (key: string): string => {
    const categories = (dictionary.playerProfile as any)?.categories as Record<string, string> | undefined;
    return categories?.[key] ?? key;
  };

  const dnaScores = useMemo(() => {
    if (!latestAssessment) return null;
    return calculateCategoryScores(latestAssessment.tests);
  }, [latestAssessment]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalBadges = BADGES.length;
    const earnedBadges = profile?.badges?.length || 0;
    const completionRate = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;
    
    // Calculate badges by month
    const badgesByMonth: Record<string, number> = {};
    profile?.badges?.forEach(badge => {
      const date = new Date(badge.grantedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      badgesByMonth[monthKey] = (badgesByMonth[monthKey] || 0) + 1;
    });

    // Get most recent badges
    const recentBadges = [...(profile?.badges || [])]
      .sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime())
      .slice(0, 5);

    // Calculate points stats
    const totalPoints = profile?.pointsTotal || 0;
    const pointsFromBadges = profile?.pointsEvents
      ?.filter((e) => e.type === 'badge_granted')
      .reduce((sum, e) => sum + e.points, 0) || 0;

    // Calculate streak (badges earned in consecutive months)
    const monthKeys = Object.keys(badgesByMonth).sort().reverse();
    let streak = 0;
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthKeys.length > 0 && monthKeys[0] === currentMonth) {
      streak = 1;
      for (let i = 1; i < monthKeys.length; i++) {
        const prevDate = new Date(monthKeys[i-1]);
        const currDate = new Date(monthKeys[i]);
        const monthDiff = (prevDate.getFullYear() - currDate.getFullYear()) * 12 + 
                         (prevDate.getMonth() - currDate.getMonth());
        if (monthDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Find rarest badge (least awarded - simulated for now)
    const rarestBadge = earnedBadges > 0 ? profile?.badges?.[0] : null;

    return {
      totalBadges,
      earnedBadges,
      completionRate,
      remainingBadges: totalBadges - earnedBadges,
      badgesByMonth,
      recentBadges,
      totalPoints,
      pointsFromBadges,
      streak,
      rarestBadge,
    };
  }, [profile]);

  const monthlyBadgeMax = useMemo(() => {
    const values = Object.values(stats.badgesByMonth);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }, [stats.badgesByMonth]);

  const displayName = kid.fullName || kid.username || kid.email;

  const pageTitle =
    dictionary.playerAchievementsPage?.title ??
    dictionary.playerProfile?.tabs?.achievements ??
    'Achievements';
  const pageSubtitle =
    dictionary.playerAchievementsPage?.subtitle ??
    'Track progress and achievements.';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/players/${kid.id}`}>
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Trophy className="h-8 w-8 text-yellow-500" />
              </motion.div>
              {pageTitle}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pageSubtitle.replace('{name}', displayName)}
            </p>
          </div>
        </div>

        {/* Quick Stats Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="hidden md:block"
        >
          <Badge className="px-4 py-2 text-lg bg-linear-to-r from-yellow-400 to-orange-500 text-white">
            <Star className="h-4 w-4 mr-2" />
            {stats.earnedBadges}/{stats.totalBadges} {dictionary.playerAchievementsPage?.badgesLabel ?? 'Badges'}
          </Badge>
        </motion.div>
      </motion.div>

      {/* DNA overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {dictionary.playerAchievementsPage?.dnaTitle ?? 'DNA snapshot'}
            </CardTitle>
            <CardDescription>
              {latestAssessment
                ? (dictionary.playerAchievementsPage?.dnaSubtitleWithDate ?? 'Latest assessment: {date}')
                    .replace('{date}', latestAssessment.sessionDate)
                : (dictionary.playerAchievementsPage?.dnaEmpty ?? 'No assessments yet.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {!dnaScores ? (
              <div className="rounded-xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000] p-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {dictionary.playerAchievementsPage?.dnaEmpty ?? 'No assessments yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {Object.entries(dnaScores).map(([key, value], index) => (
                  <motion.div
                    key={String(key)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] p-3"
                  >
                    <DnaCircularGauge
                      value={Math.round(value)}
                      max={100}
                      size={76}
                      strokeWidth={10}
                      label={categoryLabel(String(key))}
                      ariaLabel={`${String(key)} score`}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
      >
        {/* Total Badges Earned */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="h-full">
          <Card className="relative h-full overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </motion.div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.earnedBadges}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dictionary.playerAchievementsPage?.badgesEarnedLabel ?? 'Badges earned'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rate */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="h-full">
            <Card className="relative h-full overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <Badge variant="secondary" className="text-xs">{stats.completionRate}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <DnaCircularGauge
                  value={stats.completionRate}
                  max={100}
                  size={84}
                  strokeWidth={10}
                  label={dictionary.playerAchievementsPage?.completionRateLabel ?? 'Completion rate'}
                  valueSuffix="%"
                  ariaLabel="Completion rate"
                />
            </CardContent>
          </Card>
        </motion.div>

        {/* Total points from badges */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="h-full">
          <Card className="relative h-full overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="h-5 w-5 text-green-500" />
                </motion.div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.pointsFromBadges}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dictionary.playerAchievementsPage?.pointsFromBadgesLabel ?? dictionary.playerAchievementsPage?.xpFromBadgesLabel ?? 'Points from badges'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="h-full">
          <Card className="relative h-full overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
                {stats.streak > 0 && (
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Flame className="h-5 w-5 text-red-500" />
                  </motion.div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.streak}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dictionary.playerAchievementsPage?.streakLabel ?? 'Month streak'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex rtl:ml-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Award className="h-4 w-4" />
              {dictionary.playerAchievementsPage?.tabs?.overview ?? dictionary.playerProfile?.tabs?.overview ?? 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Calendar className="h-4 w-4" />
              {dictionary.playerAchievementsPage?.tabs?.recent ?? 'Recent'}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Medal className="h-4 w-4" />
              {dictionary.playerAchievementsPage?.tabs?.all ?? 'All badges'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Chart */}
              <Card className="border-2 border-[#DDDDDD] dark:border-[#000000]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {dictionary.playerAchievementsPage?.overallProgressTitle ?? 'Overall progress'}
                  </CardTitle>
                  <CardDescription>
                    {(dictionary.playerAchievementsPage?.overallProgressSubtitle ?? '{count} badges remaining to collect all')
                      .replace('{count}', String(stats.remainingBadges))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dictionary.playerAchievementsPage?.completedLabel ?? 'Completed'}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.earnedBadges} / {stats.totalBadges}
                    </span>
                  </div>
                  <DnaCircularGauge
                    value={stats.completionRate}
                    max={100}
                    size={96}
                    strokeWidth={12}
                    label={dictionary.playerAchievementsPage?.completionRateLabel ?? 'Completion rate'}
                    valueSuffix="%"
                    ariaLabel="Badges completion rate"
                  />

                  {stats.rarestBadge && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 rounded-xl bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center gap-3">
                        <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                            {dictionary.playerAchievementsPage?.firstBadgeEarnedLabel ?? 'First badge earned'}
                          </p>
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {new Date(stats.rarestBadge.grantedAt).toLocaleDateString(locale)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Activity */}
              <Card className="border-2 border-[#DDDDDD] dark:border-[#000000]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {dictionary.playerAchievementsPage?.monthlyActivityTitle ?? 'Monthly activity'}
                  </CardTitle>
                  <CardDescription>
                    {dictionary.playerAchievementsPage?.monthlyActivitySubtitle ?? 'Badges earned in recent months'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(stats.badgesByMonth)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 6)
                      .map(([month, count], index) => {
                        const date = new Date(month + '-01');
                        const monthName = date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });

                        return (
                          <motion.div
                            key={month}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] p-3"
                          >
                            <DnaCircularGauge
                              value={count}
                              max={Math.max(1, monthlyBadgeMax)}
                              size={72}
                              strokeWidth={10}
                              label={monthName}
                              ariaLabel="Monthly badges"
                            />
                          </motion.div>
                        );
                      })}

                    {Object.keys(stats.badgesByMonth).length === 0 && (
                      <div className="col-span-full rounded-xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000] p-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.playerAchievementsPage?.noBadgesYet ?? 'No badges yet'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Motivational Card */}
            {stats.remainingBadges > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-2 border-[#FF5F02] bg-linear-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Gift className="h-12 w-12 text-[#FF5F02]" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-[#262626] dark:text-white">
                          {(dictionary.playerAchievementsPage?.keepGoingTitle ?? 'Keep going! {count} more badges await!')
                            .replace('{count}', String(stats.remainingBadges))}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dictionary.playerAchievementsPage?.keepGoingSubtitle ?? 'Each badge represents a new achievement in your journey'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Recent Badges Tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000]">
              <CardHeader>
                <CardTitle>{dictionary.playerAchievementsPage?.recentBadgesTitle ?? 'Recent badges'}</CardTitle>
                <CardDescription>
                  {dictionary.playerAchievementsPage?.recentBadgesSubtitle ?? 'Latest achievements'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentBadges.map((badge, index) => {
                    return (
                      <motion.div
                        key={badge.badgeId + badge.grantedAt}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]"
                      >
                        <div className="p-3 rounded-full bg-linear-to-br from-yellow-400 to-orange-500">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#262626] dark:text-white">
                            {badgeName(badge.badgeId)}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(badge.grantedAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {badge.notes && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {badge.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {stats.recentBadges.length === 0 && (
                    <div className="text-center py-12">
                      <Medal className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {dictionary.playerAchievementsPage?.noBadgesEarnedYet ?? 'No badges earned yet'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Badges Tab */}
          <TabsContent value="all" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000]">
              <CardHeader>
                <CardTitle>{dictionary.playerAchievementsPage?.allBadgesTitle ?? 'All badges'}</CardTitle>
                <CardDescription>
                  {(dictionary.playerAchievementsPage?.allBadgesSubtitle ?? '{earned} of {total} earned')
                    .replace('{earned}', String(stats.earnedBadges))
                    .replace('{total}', String(stats.totalBadges))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {BADGES.map((badgeInfo, index) => {
                    const earned = profile?.badges?.find(b => b.badgeId === badgeInfo.id);
                    
                    return (
                      <motion.div
                        key={badgeInfo.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          earned
                            ? 'bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                        }`}
                      >
                        <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                          earned 
                            ? 'bg-linear-to-br from-yellow-400 to-orange-500' 
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {earned ? (
                            <Award className="h-8 w-8 text-white" />
                          ) : (
                            <span className="text-2xl">🔒</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#262626] dark:text-white">
                          {badgeName(badgeInfo.id)}
                        </p>
                        {earned && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(earned.grantedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
