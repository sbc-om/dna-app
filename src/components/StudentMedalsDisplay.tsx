'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentMedalsAction, getStudentCourseMedalsAction } from '@/lib/actions/medalActions';
import type { StudentMedal, Medal } from '@/lib/db/repositories/medalRepository';

interface MedalDisplay extends StudentMedal {
  medal?: Medal;
}

interface StudentMedalsDisplayProps {
  studentId: string;
  courseId?: string; // Optional: filter by specific course
  title?: string;
  description?: string;
  hideHeader?: boolean;
  locale: 'en' | 'ar';
  onTotalPointsChange?: (totalPoints: number) => void;
}

export function StudentMedalsDisplay({
  studentId,
  courseId,
  title,
  description,
  hideHeader,
  locale,
  onTotalPointsChange,
}: StudentMedalsDisplayProps) {
  const [medals, setMedals] = useState<MedalDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedals();
  }, [studentId, courseId]);

  const loadMedals = async () => {
    setLoading(true);
    try {
      const result = courseId
        ? await getStudentCourseMedalsAction(studentId, courseId)
        : await getStudentMedalsAction(studentId);

      if (result.success && result.studentMedals) {
        // Medal details are already included from the server action
        setMedals(result.studentMedals);
        
        // Calculate and send total points to parent
        const totalPoints = result.studentMedals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0);
        onTotalPointsChange?.(totalPoints);
      }
    } catch (error) {
      console.error('Load student medals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = medals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const shellClassName =
    'bg-white/6 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_90px_-50px_rgba(0,0,0,0.7)]';

  const headerClassName =
    'relative bg-white/5 border-b border-white/10 flex flex-col items-center justify-center text-center gap-1';

  const showHeader = !hideHeader && Boolean(title);

  const Title = showHeader ? (
    <div className="flex items-center justify-center gap-2 text-white">
      <motion.div
        animate={{ rotate: [0, -6, 6, -6, 0] }}
        transition={{ duration: 0.6 }}
        className="relative"
        aria-hidden
      >
        <Award className="w-5 h-5 text-white/85" />
        <motion.div
          className="absolute inset-0 bg-amber-400/20 rounded-full blur-md"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </motion.div>
      <span className="font-semibold tracking-tight">{title}</span>
    </div>
  ) : null;

  const Header =
    showHeader ? (
      <CardHeader className={headerClassName}>
        <div className="absolute inset-0 bg-linear-to-r from-yellow-500/10 via-orange-500/10 to-fuchsia-500/10" />
        <CardTitle className="relative py-4">{Title}</CardTitle>
        {description ? (
          <p className="relative pb-4 text-sm text-white/65">{description}</p>
        ) : null}
      </CardHeader>
    ) : null;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <Card className={shellClassName}>
          {Header}
          <CardContent className={showHeader ? 'pt-6' : 'pt-8'}>
            <div className="flex flex-col items-center justify-center py-10 text-white/70">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-white/70" />
              </motion.div>
              <div className="mt-3 text-sm">Loading…</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (medals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <Card className={shellClassName}>
          {Header}
          <CardContent className={showHeader ? 'pt-6' : 'pt-8'}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center py-12 rounded-2xl border border-dashed border-white/15 bg-black/20"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto w-fit"
                aria-hidden
              >
                <Award className="w-14 h-14 text-white/45" />
              </motion.div>
              <p className="mt-4 text-white/70 font-medium">No medals awarded yet</p>
              <p className="mt-2 text-sm text-white/55">
                Keep progressing—new medals will appear here.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Group medals by type and count
  const medalCounts = medals.reduce((acc, sm) => {
    if (sm.medal) {
      const key = sm.medal.id;
      if (!acc[key]) {
        acc[key] = { medal: sm.medal, count: 0, lastAwarded: sm.awardedAt };
      }
      acc[key].count++;
      if (new Date(sm.awardedAt) > new Date(acc[key].lastAwarded)) {
        acc[key].lastAwarded = sm.awardedAt;
      }
    }
    return acc;
  }, {} as Record<string, { medal: Medal; count: number; lastAwarded: string }>);

  const uniqueMedals = Object.values(medalCounts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Card className={shellClassName}>
        {Header}

        <CardContent className={showHeader ? 'pt-6' : 'pt-8'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueMedals.map(({ medal, count, lastAwarded }, index) => (
              <motion.div
                key={medal.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                whileHover={{ scale: 1.02, rotateY: 4, rotateX: 3 }}
                whileTap={{ scale: 0.98 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative group rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-linear-to-br from-yellow-500/15 via-orange-500/10 to-fuchsia-500/15 opacity-0 group-hover:opacity-100 blur-xl"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  aria-hidden
                />

                <div className="relative p-4">
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="shrink-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    >
                      <div className="text-3xl leading-none">{medal.icon}</div>
                    </motion.div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-white truncate">
                          {locale === 'ar' ? medal.nameAr : medal.name}
                        </h4>
                        {count > 1 ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="shrink-0"
                          >
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/10">
                              x{count}
                            </span>
                          </motion.div>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-white/65 line-clamp-2">
                        {locale === 'ar' ? medal.descriptionAr : medal.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-yellow-500/80 to-orange-600/80 px-2.5 py-1 text-[11px] font-bold text-white border border-white/10">
                          +{medal.points} pts
                        </span>
                        <span className="text-[11px] text-white/55 truncate">
                          Last awarded: {formatDate(lastAwarded)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total points (game-like stat tile) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mt-6 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="absolute inset-0 bg-linear-to-r from-yellow-500/10 via-orange-500/10 to-fuchsia-500/10" aria-hidden />
            <div className="relative p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-white/60 text-sm">Total Medal Points</div>
                <div className="mt-1 text-white text-xl font-bold truncate">{totalPoints}</div>
              </div>
              <motion.div
                className="h-12 w-12 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center shrink-0"
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 0.7 }}
                aria-hidden
              >
                <Award className="h-6 w-6 text-white/85" />
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
