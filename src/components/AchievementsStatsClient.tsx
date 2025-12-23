'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import type { User } from '@/lib/db/repositories/userRepository';
import type { PlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { BADGES } from '@/lib/player/badges';

interface AchievementsStatsClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User;
  profile: PlayerProfile | null;
  currentUser: User;
}

export function AchievementsStatsClient({
  dictionary,
  locale,
  kid,
  profile,
  currentUser,
}: AchievementsStatsClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

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

    // Calculate XP stats
    const totalXP = profile?.xpTotal || 0;
    const xpFromBadges = profile?.xpEvents?.filter(e => e.type === 'badge_granted')
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
      totalXP,
      xpFromBadges,
      streak,
      rarestBadge,
    };
  }, [profile]);

  const displayName = kid.fullName || kid.username || kid.email;

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
          <Link href={`/${locale}/dashboard/kids/${kid.id}`}>
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
              {locale === 'ar' ? 'الإنجازات والدستاوردات' : 'Achievements & Badges'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {locale === 'ar' 
                ? `تتبع تقدم ${displayName} ونجاحاته` 
                : `Track ${displayName}'s progress and success`}
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
            {stats.earnedBadges}/{stats.totalBadges} {locale === 'ar' ? 'شارة' : 'Badges'}
          </Badge>
        </motion.div>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total Badges Earned */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="relative overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
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
            <CardContent>
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.earnedBadges}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {locale === 'ar' ? 'شارات مكتسبة' : 'Badges Earned'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rate */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="relative overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="text-xs">
                  {stats.completionRate}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.completionRate}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
                {locale === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}
              </p>
              <Progress value={stats.completionRate} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Total XP from Badges */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="relative overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
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
            <CardContent>
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.xpFromBadges}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {locale === 'ar' ? 'نقاط خبرة من الشارات' : 'XP from Badges'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="relative overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
                {stats.streak > 0 && (
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔥
                  </motion.div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#262626] dark:text-white">
                {stats.streak}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {locale === 'ar' ? 'أشهر متتالية' : 'Month Streak'}
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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <Award className="h-4 w-4" />
              {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Calendar className="h-4 w-4" />
              {locale === 'ar' ? 'الأخيرة' : 'Recent'}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Medal className="h-4 w-4" />
              {locale === 'ar' ? 'الكل' : 'All Badges'}
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
                    {locale === 'ar' ? 'التقدم العام' : 'Overall Progress'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ar' 
                      ? `${stats.remainingBadges} شارة متبقية للحصول على الجميع` 
                      : `${stats.remainingBadges} badges remaining to collect all`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{locale === 'ar' ? 'مكتملة' : 'Completed'}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.earnedBadges} / {stats.totalBadges}
                    </span>
                  </div>
                  <Progress value={stats.completionRate} className="h-3" />
                  
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
                            {locale === 'ar' ? 'أول شارة مكتسبة' : 'First Badge Earned'}
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
                    {locale === 'ar' ? 'النشاط الشهري' : 'Monthly Activity'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ar' 
                      ? 'الشارات المكتسبة في الأشهر الأخيرة' 
                      : 'Badges earned in recent months'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.badgesByMonth)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 6)
                      .map(([month, count], index) => {
                        const date = new Date(month + '-01');
                        const monthName = date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
                        const maxCount = Math.max(...Object.values(stats.badgesByMonth));
                        const percentage = (count / maxCount) * 100;

                        return (
                          <motion.div
                            key={month}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{monthName}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="h-full bg-linear-to-r from-blue-500 to-purple-500"
                              />
                            </div>
                          </motion.div>
                        );
                      })}

                    {Object.keys(stats.badgesByMonth).length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        {locale === 'ar' ? 'لا توجد شارات بعد' : 'No badges yet'}
                      </p>
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
                          {locale === 'ar' 
                            ? `استمر! ${stats.remainingBadges} شارة أخرى في انتظارك!` 
                            : `Keep going! ${stats.remainingBadges} more badges await!`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {locale === 'ar' 
                            ? 'كل شارة تمثل إنجازاً جديداً في رحلتك' 
                            : 'Each badge represents a new achievement in your journey'}
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
                <CardTitle>{locale === 'ar' ? 'الشارات الأخيرة' : 'Recent Badges'}</CardTitle>
                <CardDescription>
                  {locale === 'ar' ? 'آخر الإنجازات' : 'Latest achievements'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentBadges.map((badge, index) => {
                    const badgeInfo = BADGES.find(b => b.id === badge.badgeId);
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
                            {/* Badge name from dictionary would go here */}
                            {badge.badgeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
                        {locale === 'ar' ? 'لا توجد شارات بعد' : 'No badges earned yet'}
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
                <CardTitle>{locale === 'ar' ? 'جميع الشارات' : 'All Badges'}</CardTitle>
                <CardDescription>
                  {stats.earnedBadges} {locale === 'ar' ? 'من' : 'of'} {stats.totalBadges} {locale === 'ar' ? 'مكتسبة' : 'earned'}
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
                          {badgeInfo.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
