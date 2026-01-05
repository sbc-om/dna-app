'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import type { User } from '@/lib/db/repositories/userRepository';
import type { ProgramLevel } from '@/lib/db/repositories/programLevelRepository';
import type { DnaAssessmentSession } from '@/lib/actions/dnaAssessmentActions';
import type { Program } from '@/lib/db/repositories/programRepository';
import type { ProgramEnrollment } from '@/lib/db/repositories/programEnrollmentRepository';
import {
  getPlayerProgramEnrollmentsAction,
  getProgramLevelsForPlayerProgramAction,
} from '@/lib/actions/programEnrollmentActions';
import {
  getProgramAttendanceForUserInProgramAction,
} from '@/lib/actions/programAttendanceActions';
import { getDnaAssessmentsForPlayerAction } from '@/lib/actions/dnaAssessmentActions';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Copy,
  Download,
  IdCard,
  Layers,
  Loader2,
  Share2,
  ShieldCheck,
} from 'lucide-react';

type CardStatus = 'current' | 'completed' | 'locked';

type AttendanceRow = { sessionDate: string; present: boolean };

type EnrollmentRow = ProgramEnrollment & {
  program?: Program | null;
  currentLevel?: ProgramLevel | null;
};

type ProgramLevelCardModel = {
  id: string;
  programId: string;
  programName: string;
  programImage?: string | null;
  levelId: string;
  levelOrder: number;
  levelName: string;
  levelColor: string;
  status: CardStatus;

  requiredSessions: number;
  attendedSessions: number;

  requiredPoints: number;
  earnedPoints: number;

  joinedAt?: string;
  levelStartedAt?: string;
  levelEndedAt?: string;

  programPointsTotal: number;
};

function dateOnlyFromIso(iso?: string | null): string | null {
  if (!iso) return null;
  // expected ISO or YYYY-MM-DD
  return iso.length >= 10 ? iso.slice(0, 10) : null;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeNumber(n: unknown) {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function computeNaStats(sessions: DnaAssessmentSession[]) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { latestNaScore: null as number | null, averageNaScore: null as number | null };
  }

  const latestNaScore = safeNumber(sessions[0]?.naScore);
  const total = sessions.reduce((sum, s) => sum + safeNumber(s.naScore), 0);
  const averageNaScore = total / Math.max(1, sessions.length);
  return { latestNaScore, averageNaScore };
}

function sumAttendanceInRange(records: AttendanceRow[], startDate: string | null, endDate: string | null) {
  if (!startDate) return 0;
  const end = endDate ?? '9999-12-31';
  let attended = 0;
  for (const r of records) {
    if (!r.present) continue;
    if (r.sessionDate >= startDate && r.sessionDate <= end) attended += 1;
  }
  return attended;
}

function sumPointsInRange(enrollment: EnrollmentRow, startIso: string | null, endIso: string | null) {
  if (!startIso) return 0;
  const start = startIso;
  const end = endIso ?? '9999-12-31T23:59:59.999Z';

  let sum = 0;
  for (const note of enrollment.coachNotes || []) {
    const t = note.createdAt;
    if (!t) continue;
    if (t >= start && t <= end) sum += safeNumber(note.pointsDelta);
  }
  return sum;
}

function getLevelPeriodBounds(enrollment: EnrollmentRow, levelId: string) {
  const entries = (enrollment.levelHistory || []).filter((h) => h.levelId === levelId);
  if (entries.length === 0) return { startedAt: null as string | null, endedAt: null as string | null };
  const startedAt = entries
    .map((e) => e.startedAt)
    .filter(Boolean)
    .sort()[0] ?? null;

  const endedAtCandidates = entries
    .map((e) => e.endedAt)
    .filter(Boolean)
    .sort();
  const endedAt = endedAtCandidates.length > 0 ? endedAtCandidates[endedAtCandidates.length - 1]! : null;

  return { startedAt, endedAt };
}

export function PlayerCardPageClient(props: {
  dictionary: Dictionary;
  locale: Locale;
  academyId: string;
  kid: User;
}) {
  const title =
    (props.dictionary as any).playerCardPage?.title ??
    props.dictionary.playerProfile?.actions?.viewCard ??
    'Player card';

  const subtitle = (props.dictionary as any).playerCardPage?.subtitle ?? '';

  const t = (props.dictionary as any).playerCardPage ?? {};
  const tCommon = (props.dictionary as any).common ?? {};

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ProgramLevelCardModel[]>([]);
  const [programsCount, setProgramsCount] = useState(0);
  const [naStats, setNaStats] = useState<{ latestNaScore: number | null; averageNaScore: number | null }>({
    latestNaScore: null,
    averageNaScore: null,
  });
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  const [levelQuery, setLevelQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CardStatus | 'all'>('all');

  const cardShell =
    'rounded-3xl border-2 border-[#DDDDDD] bg-white shadow-lg dark:border-[#000000] dark:bg-[#262626] overflow-hidden';
  const inputClass =
    'h-12 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const outlineButtonClass =
    'h-11 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#111114] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1d]';
  const ctaButtonClass =
    'h-11 rounded-xl bg-[#0b0b0f] text-white hover:bg-[#14141a] disabled:opacity-60 disabled:hover:bg-[#0b0b0f]';

  // Store refs by card id so we can export each card.
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setCardRef = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      cardRefs.current[id] = el;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [enrollmentsRes, assessmentsRes] = await Promise.all([
          getPlayerProgramEnrollmentsAction({
            locale: props.locale,
            academyId: props.academyId,
            userId: props.kid.id,
          }),
          getDnaAssessmentsForPlayerAction({
            locale: props.locale,
            academyId: props.academyId,
            playerId: props.kid.id,
          }),
        ]);

        if (cancelled) return;

        if (assessmentsRes.success) {
          setNaStats(computeNaStats(assessmentsRes.sessions as DnaAssessmentSession[]));
        }

        if (!enrollmentsRes.success) {
          toast.error(enrollmentsRes.error || tCommon.error || 'Failed to load programs');
          setCards([]);
          setProgramsCount(0);
          setActiveProgramId(null);
          return;
        }

        const enrollments = enrollmentsRes.enrollments as EnrollmentRow[];
        setProgramsCount(enrollments.length);
        setActiveProgramId((prev) => prev ?? enrollments[0]?.programId ?? null);

        // Fetch levels + attendance timeline per program.
        const perProgram = await Promise.all(
          enrollments.map(async (enrollment) => {
            const [levelsRes, attendanceRes] = await Promise.all([
              getProgramLevelsForPlayerProgramAction({
                locale: props.locale,
                academyId: props.academyId,
                programId: enrollment.programId,
                userId: props.kid.id,
              }),
              getProgramAttendanceForUserInProgramAction({
                locale: props.locale,
                academyId: props.academyId,
                programId: enrollment.programId,
                userId: props.kid.id,
              }),
            ]);

            const levels = levelsRes.success ? (levelsRes.levels as ProgramLevel[]) : [];
            const attendance: AttendanceRow[] = attendanceRes.success
              ? (attendanceRes.records as AttendanceRow[])
              : [];

            const sortedLevels = [...levels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const currentLevelOrder = sortedLevels.find((l) => l.id === enrollment.currentLevelId)?.order ?? null;

            const programName = enrollment.program
              ? props.locale === 'ar'
                ? (enrollment.program as any).nameAr || enrollment.program.name
                : enrollment.program.name
              : 'Program';

            const programImage = enrollment.program ? ((enrollment.program as any).image as string | undefined) : undefined;

            const models: ProgramLevelCardModel[] = sortedLevels.map((lvl) => {
              const levelName = props.locale === 'ar' ? lvl.nameAr || lvl.name : lvl.name;

              const { startedAt, endedAt } = getLevelPeriodBounds(enrollment, lvl.id);
              const startDate = dateOnlyFromIso(startedAt);
              const endDate = endedAt ? dateOnlyFromIso(endedAt) : null;

              const requiredSessions = safeNumber(lvl.passRules?.minSessionsAttended);
              const requiredPoints = safeNumber(lvl.passRules?.minPointsEarned);

              const attendedSessions = sumAttendanceInRange(attendance, startDate, endDate);
              const earnedPoints = sumPointsInRange(enrollment, startedAt, endedAt);

              let status: CardStatus = 'locked';
              if (enrollment.currentLevelId && lvl.id === enrollment.currentLevelId) status = 'current';
              else if (currentLevelOrder !== null && lvl.order < currentLevelOrder) status = 'completed';
              else if ((enrollment.levelHistory || []).some((h) => h.levelId === lvl.id)) status = 'completed';

              return {
                id: `${enrollment.programId}:${lvl.id}`,
                programId: enrollment.programId,
                programName,
                programImage: programImage ?? null,
                levelId: lvl.id,
                levelOrder: lvl.order,
                levelName,
                levelColor: lvl.color,
                status,
                requiredSessions,
                attendedSessions,
                requiredPoints,
                earnedPoints,
                joinedAt: enrollment.joinedAt,
                levelStartedAt: startedAt ?? undefined,
                levelEndedAt: endedAt ?? undefined,
                programPointsTotal: safeNumber(enrollment.pointsTotal),
              };
            });

            return models;
          })
        );

        if (cancelled) return;
        setCards(perProgram.flat());
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error(tCommon.error || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [props.academyId, props.kid.id, props.locale]);

  const programs = useMemo(() => {
    const map = new Map<string, { programId: string; programName: string }>();
    for (const c of cards) {
      if (!map.has(c.programId)) map.set(c.programId, { programId: c.programId, programName: c.programName });
    }
    return Array.from(map.values()).sort((a, b) => a.programName.localeCompare(b.programName));
  }, [cards]);

  const visibleCards = useMemo(() => {
    const q = levelQuery.trim().toLowerCase();
    let list = !activeProgramId ? cards : cards.filter((c) => c.programId === activeProgramId);

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (q) {
      list = list.filter((c) => {
        const hay = `${c.programName} ${c.levelName} ${c.levelOrder}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [activeProgramId, cards, levelQuery, statusFilter]);

  const exportCardToPng = useCallback(
    async (cardId: string, filename: string) => {
      const el = cardRefs.current[cardId];
      if (!el) throw new Error('Card not found');
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      downloadDataUrl(filename, canvas.toDataURL('image/png'));
    },
    []
  );

  const exportCardToPdf = useCallback(
    async (cardId: string, filename: string) => {
      const el = cardRefs.current[cardId];
      if (!el) throw new Error('Card not found');

      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
        compress: true,
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    },
    []
  );

  const exportAllVisibleToPdf = useCallback(async () => {
    if (visibleCards.length === 0) return;
    const { jsPDF } = await import('jspdf');

    // Render first card to set initial page size.
    const firstEl = cardRefs.current[visibleCards[0]!.id];
    if (!firstEl) throw new Error('Card not found');
    const firstCanvas = await html2canvas(firstEl, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    const pdf = new jsPDF({
      orientation: firstCanvas.width > firstCanvas.height ? 'l' : 'p',
      unit: 'px',
      format: [firstCanvas.width, firstCanvas.height],
      compress: true,
    });

    pdf.addImage(firstCanvas.toDataURL('image/png'), 'PNG', 0, 0, firstCanvas.width, firstCanvas.height);

    for (let i = 1; i < visibleCards.length; i += 1) {
      const c = visibleCards[i]!;
      const el = cardRefs.current[c.id];
      if (!el) continue;
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      // Keep consistent page size; add image scaled to page.
      pdf.addPage([firstCanvas.width, firstCanvas.height], firstCanvas.width > firstCanvas.height ? 'l' : 'p');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, firstCanvas.width, firstCanvas.height);
    }

    const baseName = `${props.kid.fullName || props.kid.username}-cards.pdf`;
    pdf.save(baseName);
  }, [props.kid.fullName, props.kid.username, visibleCards]);

  const handleExportAllPng = useCallback(async () => {
    if (visibleCards.length === 0) return;
    setExportBusy(true);
    try {
      for (const c of visibleCards) {
        const safeProgram = c.programName.replace(/[^a-z0-9-_]+/gi, '_');
        const safeLevel = `L${c.levelOrder}_${c.levelName}`.replace(/[^a-z0-9-_]+/gi, '_');
        const filename = `${props.kid.fullName || props.kid.username}-${safeProgram}-${safeLevel}.png`;
        // eslint-disable-next-line no-await-in-loop
        await exportCardToPng(c.id, filename);
        // Give the browser a beat between downloads.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success(t.allDownloaded || tCommon.success || 'Downloaded');
    } catch (e) {
      console.error(e);
      toast.error(tCommon.error || 'Failed to export');
    } finally {
      setExportBusy(false);
    }
  }, [exportCardToPng, props.kid.fullName, props.kid.username, t, tCommon, visibleCards]);

  const handleExportAllPdf = useCallback(async () => {
    if (visibleCards.length === 0) return;
    setExportBusy(true);
    try {
      await exportAllVisibleToPdf();
      toast.success(t.allDownloaded || tCommon.success || 'Downloaded');
    } catch (e) {
      console.error(e);
      toast.error(tCommon.error || 'Failed to export');
    } finally {
      setExportBusy(false);
    }
  }, [exportAllVisibleToPdf, t, tCommon, visibleCards.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
      className="space-y-6"
    >
      <Card className={cardShell}>
        <CardHeader className="border-b border-black/10 dark:border-white/10 bg-gray-50/80 dark:bg-[#0f0f12]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button asChild variant="outline" size="icon" className="rounded-xl">
                <Link href={`/${props.locale}/dashboard/players/${props.kid.id}`} aria-label={tCommon.back || 'Back'}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#262626] dark:text-white truncate">{title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{subtitle}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <motion.div whileHover={{ rotate: [-2, 2, -1, 0] }} transition={{ duration: 0.35 }}>
                <Button
                  onClick={handleExportAllPng}
                  disabled={exportBusy || loading || visibleCards.length === 0}
                  className="rounded-xl bg-linear-to-r from-[#FF5F02] via-[#FF7A2E] to-[#FF3D00] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35"
                >
                  {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {t.downloadAllPng || 'Download all (PNG)'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ rotate: [2, -2, 1, 0] }} transition={{ duration: 0.35 }}>
                <Button
                  onClick={handleExportAllPdf}
                  disabled={exportBusy || loading || visibleCards.length === 0}
                  variant="outline"
                  className={outlineButtonClass}
                >
                  {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {t.downloadAllPdf || 'Download all (PDF)'}
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <Input
                value={levelQuery}
                onChange={(e) => setLevelQuery(e.target.value)}
                placeholder={t.searchPlaceholder || tCommon.search || 'Search'}
                className={inputClass}
              />
            </div>

            <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? ctaButtonClass : outlineButtonClass}
              >
                {t.allStatuses || 'All'}
              </Button>
              <Button
                type="button"
                variant={statusFilter === 'current' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('current')}
                className={statusFilter === 'current' ? ctaButtonClass : outlineButtonClass}
              >
                {t.statusCurrent || 'Current'}
              </Button>
              <Button
                type="button"
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                className={statusFilter === 'completed' ? ctaButtonClass : outlineButtonClass}
              >
                {t.statusCompleted || 'Completed'}
              </Button>
              <Button
                type="button"
                variant={statusFilter === 'locked' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('locked')}
                className={statusFilter === 'locked' ? ctaButtonClass : outlineButtonClass}
              >
                {t.statusLocked || 'Locked'}
              </Button>

              <div className="w-full h-px bg-black/10 dark:bg-white/10 my-1" />

              {programs.map((p) => (
                <Button
                  key={p.programId}
                  type="button"
                  variant={activeProgramId === p.programId ? 'default' : 'outline'}
                  onClick={() => setActiveProgramId(p.programId)}
                  className={activeProgramId === p.programId ? ctaButtonClass : outlineButtonClass}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  <span className="truncate max-w-56">{p.programName}</span>
                </Button>
              ))}

              {programs.length > 1 && (
                <Button
                  type="button"
                  variant={!activeProgramId ? 'default' : 'outline'}
                  onClick={() => setActiveProgramId(null)}
                  className={!activeProgramId ? ctaButtonClass : outlineButtonClass}
                >
                  {t.allPrograms || 'All programs'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="sm:hidden mb-4 flex gap-2">
            <Button
              onClick={handleExportAllPng}
              disabled={exportBusy || loading || visibleCards.length === 0}
              className="flex-1 rounded-xl bg-linear-to-r from-[#FF5F02] via-[#FF7A2E] to-[#FF3D00] text-white shadow-lg shadow-orange-500/20"
            >
              {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t.downloadAllPng || 'Download all (PNG)'}
            </Button>
            <Button
              onClick={handleExportAllPdf}
              disabled={exportBusy || loading || visibleCards.length === 0}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t.downloadAllPdf || 'Download all (PDF)'}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-14"
              >
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading || tCommon.loading || 'Loading...'}</span>
                </div>
              </motion.div>
            ) : visibleCards.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/10 bg-linear-to-br from-black/5 via-white/5 to-black/10 p-10 text-center"
              >
                <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-[#FF5F02]/30 to-transparent border border-[#FF5F02]/30 mb-3">
                  <IdCard className="h-6 w-6 text-[#FF5F02]" />
                </div>
                <div className="text-base font-semibold text-[#262626] dark:text-white">
                  {t.noPrograms || 'No program enrollments found'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.noProgramsHint || ''}</div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {visibleCards.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="space-y-3"
                  >
                    <ProgramLevelCard
                      ref={setCardRef(c.id)}
                      player={props.kid}
                      model={c}
                      locale={props.locale}
                      dictionary={props.dictionary}
                      latestNaScore={naStats.latestNaScore}
                      averageNaScore={naStats.averageNaScore}
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className={`flex-1 ${outlineButtonClass}`}
                        disabled={exportBusy}
                        onClick={async () => {
                          setExportBusy(true);
                          try {
                            const safeProgram = c.programName.replace(/[^a-z0-9-_]+/gi, '_');
                            const safeLevel = `L${c.levelOrder}_${c.levelName}`.replace(/[^a-z0-9-_]+/gi, '_');
                            await exportCardToPng(
                              c.id,
                              `${props.kid.fullName || props.kid.username}-${safeProgram}-${safeLevel}.png`
                            );
                          } catch (e) {
                            console.error(e);
                            toast.error(tCommon.error || 'Failed to export');
                          } finally {
                            setExportBusy(false);
                          }
                        }}
                      >
                        {exportBusy ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {t.downloadPng || 'Download PNG'}
                      </Button>
                      <Button
                        className={`flex-1 ${ctaButtonClass}`}
                        disabled={exportBusy}
                        onClick={async () => {
                          setExportBusy(true);
                          try {
                            const safeProgram = c.programName.replace(/[^a-z0-9-_]+/gi, '_');
                            const safeLevel = `L${c.levelOrder}_${c.levelName}`.replace(/[^a-z0-9-_]+/gi, '_');
                            await exportCardToPdf(
                              c.id,
                              `${props.kid.fullName || props.kid.username}-${safeProgram}-${safeLevel}.pdf`
                            );
                          } catch (e) {
                            console.error(e);
                            toast.error(tCommon.error || 'Failed to export');
                          } finally {
                            setExportBusy(false);
                          }
                        }}
                      >
                        {exportBusy ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {t.downloadPdf || 'Download PDF'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const ProgramLevelCard = forwardRef<
  HTMLDivElement,
  {
    player: User;
    model: ProgramLevelCardModel;
    locale: Locale;
    dictionary: Dictionary;
    latestNaScore: number | null;
    averageNaScore: number | null;
  }
>(function ProgramLevelCardInner(props, ref) {
  const { player, model } = props;
  const t = (props.dictionary as any).playerCardPage ?? {};
  const tCommon = (props.dictionary as any).common ?? {};

  const sessionsProgress = model.requiredSessions > 0 ? clamp01(model.attendedSessions / model.requiredSessions) : 0;
  const pointsProgress = model.requiredPoints > 0 ? clamp01(model.earnedPoints / model.requiredPoints) : 0;

  const statusLabel =
    model.status === 'current'
      ? t.statusCurrent || 'Current'
      : model.status === 'completed'
        ? t.statusCompleted || 'Completed'
        : t.statusLocked || 'Locked';

  const statusClass =
    model.status === 'current'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      : model.status === 'completed'
        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
        : 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20';

  const accent = model.levelColor || '#FF5F02';
  const safeAccent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#FF5F02';

  const imageSrc = model.programImage || player.profilePicture || '';
  const imageAlt = model.programName || (player.fullName || player.username) || 'Program';

  const sessionsPct = Math.round(sessionsProgress * 100);
  const pointsPct = Math.round(pointsProgress * 100);

  const copyText = async (text: string) => {
    // Avoid relying on global `navigator` typing (can be narrowed incorrectly in some TS setups).
    const nav = (typeof window !== 'undefined' ? window.navigator : undefined) as any;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers: temporary textarea + execCommand.
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    if (!ok) throw new Error('copy_failed');
  };

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) return;
      await copyText(url);
      toast.success(tCommon.copied || 'Copied');
    } catch {
      toast.error(tCommon.error || 'Failed');
    }
  };

  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) return;

      // Prefer the native share sheet on mobile when available.
      const nav = (typeof window !== 'undefined' ? window.navigator : undefined) as any;
      if (nav?.share) {
        await nav.share({
          title: player.fullName || player.username || 'Player',
          url,
        });
        return;
      }

      await copyText(url);
      toast.success(tCommon.copied || 'Copied');
    } catch {
      toast.error(tCommon.error || 'Failed');
    }
  };

  return (
    <div ref={ref} className="relative rounded-[34px] p-4 bg-linear-to-br from-[#FF3D00] via-[#FF5F02] to-[#FF9A2E] shadow-2xl shadow-orange-500/25">
      {/* Dark cutout accent (helps emulate the reference corner notch) */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-black/35 blur-xl" />

      <div className="relative rounded-[28px] overflow-hidden">
        {/* Portrait area */}
        <div className="relative h-64 sm:h-72 w-full flex items-end justify-center">
          <div className="absolute inset-0 bg-black/15" />
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              crossOrigin="anonymous"
              className="relative z-10 h-56 w-56 sm:h-64 sm:w-64 rounded-3xl object-cover shadow-2xl shadow-black/40 ring-1 ring-white/10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="relative z-10 h-56 w-56 sm:h-64 sm:w-64 rounded-3xl bg-black/25 ring-1 ring-white/10" />
          )}

          {/* Subtle top vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%)',
            }}
          />
        </div>

        {/* Floating glass panel */}
        <div className="absolute left-4 right-4 bottom-4 rounded-[26px] bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-white truncate">
                  {player.fullName || player.username || (t.playerLabel || 'Player')}
                </div>
                {player.username ? (
                  <div className="text-sm font-semibold text-[#FF5F02] truncate">@{player.username}</div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center transition"
                  aria-label={tCommon.share || 'Share'}
                >
                  <Share2 className="h-4 w-4 text-white/80" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center transition"
                  aria-label={tCommon.copy || 'Copy'}
                >
                  <Copy className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>

            <div className="mt-3 h-px w-full bg-white/10" />

            <div className="mt-4 grid grid-cols-2 gap-4">
              <RingStat
                label={t.sessionsLabel || 'Sessions'}
                value={`${sessionsPct}%`}
                color="#FF5F02"
                percent={sessionsPct}
              />
              <RingStat
                label={t.pointsLabel || 'Points'}
                value={`${pointsPct}%`}
                color={safeAccent}
                percent={pointsPct}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span className="font-semibold whitespace-nowrap">
                    {t.levelLabel || 'Level'} {model.levelOrder}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="truncate">{model.levelName}</span>
                </div>
                <div className="mt-1 text-xs text-white/60 truncate">{t.programLabel || 'Program'}: {model.programName}</div>
              </div>

              <div className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${statusClass}`}>{statusLabel}</div>
            </div>

            {/* Extra compact KPIs */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniKpiDark label={t.programPointsTotal || 'Program points'} value={`${Math.round(model.programPointsTotal)}`} />
              <MiniKpiDark label={t.latestNaScore || 'Latest NA'} value={props.latestNaScore === null ? '—' : `${Math.round(props.latestNaScore)}`} />
              <MiniKpiDark label={t.averageNaScore || 'Avg NA'} value={props.averageNaScore === null ? '—' : `${Math.round(props.averageNaScore)}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function RingStat(props: { label: string; value: string; percent: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(props.percent)));
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        <svg viewBox="0 0 36 36" className="h-12 w-12">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.12)" strokeWidth="3.2" />
          <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="transparent"
            stroke={props.color}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset="25"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-9 w-9 rounded-full bg-black/75 border border-white/10" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs text-white/60 truncate">{props.label}</div>
        <div className="text-base font-extrabold text-white">{props.value}</div>
      </div>
    </div>
  );
}

function MiniKpiDark(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/60 truncate">{props.label}</div>
      <div className="mt-1 text-base font-extrabold text-white truncate">{props.value}</div>
    </div>
  );
}

function KpiBlock(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="text-xs text-gray-600 dark:text-gray-400">{props.label}</div>
      <div className="mt-1 text-2xl font-extrabold text-[#262626] dark:text-white">{props.value}</div>
      <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{props.hint}</div>
    </div>
  );
}

function ProgressRow(props: { label: string; progress: number; left: string; right: string; color: string }) {
  const pct = Math.round(clamp01(props.progress) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span className="truncate">{props.label}</span>
        <span className="shrink-0">
          {props.left} / {props.right} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${props.color}, ${props.color}66)` }}
        />
      </div>
    </div>
  );
}

function MiniKpi(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-gray-50/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">{props.label}</div>
      <div className="mt-1 text-base font-extrabold text-[#262626] dark:text-white">{props.value}</div>
    </div>
  );
}
