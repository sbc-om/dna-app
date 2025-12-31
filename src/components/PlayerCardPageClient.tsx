'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Download,
  IdCard,
  Layers,
  Loader2,
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
    if (!activeProgramId) return cards;
    return cards.filter((c) => c.programId === activeProgramId);
  }, [cards, activeProgramId]);

  const exportCardToPng = useCallback(
    async (cardId: string, filename: string) => {
      const el = cardRefs.current[cardId];
      if (!el) throw new Error('Card not found');
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: null,
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
        backgroundColor: '#000000',
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
      backgroundColor: '#000000',
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
        backgroundColor: '#000000',
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="outline" size="icon" className="rounded-xl">
            <Link href={`/${props.locale}/dashboard/players/${props.kid.id}`} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-[#FF5F02]" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#262626] dark:text-white truncate">
                {title}
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {subtitle}
            </p>
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
          <Button
            onClick={handleExportAllPdf}
            disabled={exportBusy || loading || visibleCards.length === 0}
            variant="outline"
            className="rounded-xl"
          >
            {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {t.downloadAllPdf || 'Download all (PDF)'}
          </Button>
        </div>
      </div>


      <Card className="rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-lg dark:border-[#000000] dark:bg-[#262626] overflow-hidden">
        <CardHeader className="border-b-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-[#262626] dark:text-white truncate">
                {props.kid.fullName || props.kid.username}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t.hint || ''}
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 text-[#FF5F02]" />
              <span>
                {t.generatedFor || 'Generated for'}{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{programsCount}</span>{' '}
                {t.programs || 'programs'}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div
              whileHover={{ scale: 1.02, rotate: -0.25 }}
              className="rounded-2xl border border-white/10 bg-linear-to-br from-[#FF5F02]/12 via-white/5 to-transparent p-4 dark:from-[#FF5F02]/18"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400">{t.latestNaScore || 'Latest NA Score'}</div>
              <div className="mt-1 text-2xl font-extrabold text-[#262626] dark:text-white">
                {naStats.latestNaScore === null ? '—' : Math.round(naStats.latestNaScore)}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, rotate: 0.25 }}
              className="rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 via-white/5 to-transparent p-4 dark:from-blue-500/15"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400">{t.averageNaScore || 'Average NA Score'}</div>
              <div className="mt-1 text-2xl font-extrabold text-[#262626] dark:text-white">
                {naStats.averageNaScore === null ? '—' : Math.round(naStats.averageNaScore)}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, rotate: -0.1 }}
              className="rounded-2xl border border-white/10 bg-linear-to-br from-emerald-500/10 via-white/5 to-transparent p-4 dark:from-emerald-500/15"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400">{t.totalCards || 'Total cards'}</div>
              <div className="mt-1 text-2xl font-extrabold text-[#262626] dark:text-white">{cards.length}</div>
            </motion.div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {programs.map((p, idx) => (
              <motion.button
                key={p.programId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveProgramId(p.programId)}
                className={
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-all ' +
                  (activeProgramId === p.programId
                    ? 'border-[#FF5F02]/60 bg-linear-to-r from-[#FF5F02]/20 to-transparent text-[#262626] dark:text-white shadow-lg shadow-orange-500/10'
                    : 'border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10')
                }
              >
                <Layers className="h-4 w-4" />
                <span className="truncate max-w-56">{p.programName}</span>
              </motion.button>
            ))}

            {programs.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveProgramId(null)}
                className={
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-all ' +
                  (!activeProgramId
                    ? 'border-[#FF5F02]/60 bg-linear-to-r from-[#FF5F02]/20 to-transparent text-[#262626] dark:text-white shadow-lg shadow-orange-500/10'
                    : 'border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10')
                }
              >
                {t.allPrograms || 'All programs'}
              </motion.button>
            )}
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t.noProgramsHint || ''}
                </div>
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
                        className="flex-1 rounded-xl"
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
                        {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        {t.downloadPng || 'Download PNG'}
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-linear-to-r from-[#FF5F02] via-[#FF7A2E] to-[#FF3D00] text-white shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25"
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
                        {exportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
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

const ProgramLevelCard = motion(
  forwardRef<
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

    const sessionsProgress = model.requiredSessions > 0 ? clamp01(model.attendedSessions / model.requiredSessions) : 0;
    const pointsProgress = model.requiredPoints > 0 ? clamp01(model.earnedPoints / model.requiredPoints) : 0;

    const statusLabel =
      model.status === 'current'
        ? t.statusCurrent || 'Current'
        : model.status === 'completed'
          ? t.statusCompleted || 'Completed'
          : t.statusLocked || 'Locked';

    const statusTone =
      model.status === 'current'
        ? 'from-emerald-500/25 to-transparent border-emerald-500/25'
        : model.status === 'completed'
          ? 'from-blue-500/20 to-transparent border-blue-500/20'
          : 'from-white/10 to-transparent border-white/10';

    const accent = model.levelColor || '#FF5F02';
    const safeAccent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#FF5F02';

    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.02, rotateY: 3, rotateX: 2 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative rounded-[28px] overflow-hidden border-2 border-white/10 bg-[#0b0b0f] shadow-2xl"
      >
        {/* Animated glow */}
        <motion.div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              `radial-gradient(1100px 380px at 20% 15%, ${safeAccent}33, transparent 60%),` +
              `radial-gradient(900px 300px at 80% 30%, #3b82f633, transparent 55%),` +
              `radial-gradient(800px 260px at 50% 90%, #10b98122, transparent 60%)`,
          }}
          animate={{ opacity: [0.55, 0.75, 0.6] }}
          transition={{ duration: 3.6, repeat: Infinity }}
        />

        {/* Card body with fixed export-friendly size */}
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: safeAccent, boxShadow: `0 0 18px ${safeAccent}66` }}
                />
                <div className="text-xs uppercase tracking-wider text-white/70">
                  {t.programLabel || 'Program'}
                </div>
              </div>
              <div className="mt-1 text-lg font-extrabold text-white truncate">{model.programName}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="font-semibold">
                    {t.levelLabel || 'Level'} {model.levelOrder}
                  </span>
                </span>
                <span className="text-white/50">•</span>
                <span className="truncate">{model.levelName}</span>
              </div>
            </div>

            <div className={`shrink-0 rounded-2xl border px-3 py-2 bg-linear-to-br ${statusTone}`}>
              <div className="text-[10px] uppercase tracking-wider text-white/70">{t.statusLabel || 'Status'}</div>
              <div className="mt-0.5 text-sm font-bold text-white">{statusLabel}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatPill
              label={t.pointsLabel || 'Points'}
              value={`${Math.max(0, Math.round(model.earnedPoints))}`}
              hint={
                model.requiredPoints > 0
                  ? `${t.of || 'of'} ${Math.round(model.requiredPoints)}`
                  : t.noRequirement || 'No requirement'
              }
              accent={safeAccent}
            />
            <StatPill
              label={t.sessionsLabel || 'Sessions'}
              value={`${Math.max(0, Math.round(model.attendedSessions))}`}
              hint={
                model.requiredSessions > 0
                  ? `${t.of || 'of'} ${Math.round(model.requiredSessions)}`
                  : t.noRequirement || 'No requirement'
              }
              accent="#22c55e"
            />
          </div>

          <div className="mt-4 space-y-3">
            <ProgressRow
              label={t.sessionsProgress || 'Sessions progress'}
              progress={sessionsProgress}
              left={`${Math.round(model.attendedSessions)}`}
              right={model.requiredSessions > 0 ? `${Math.round(model.requiredSessions)}` : '—'}
              color="#22c55e"
            />
            <ProgressRow
              label={t.pointsProgress || 'Points progress'}
              progress={pointsProgress}
              left={`${Math.round(model.earnedPoints)}`}
              right={model.requiredPoints > 0 ? `${Math.round(model.requiredPoints)}` : '—'}
              color={safeAccent}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniKpi label={t.programPointsTotal || 'Program points'} value={`${Math.round(model.programPointsTotal)}`} />
            <MiniKpi
              label={t.latestNaScore || 'Latest NA'}
              value={props.latestNaScore === null ? '—' : `${Math.round(props.latestNaScore)}`}
            />
            <MiniKpi
              label={t.averageNaScore || 'Avg NA'}
              value={props.averageNaScore === null ? '—' : `${Math.round(props.averageNaScore)}`}
            />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/50">{t.playerLabel || 'Player'}</div>
              <div className="mt-1 text-sm font-semibold text-white truncate">{player.fullName || player.username}</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/50">{t.generatedAt || 'Generated'}</div>
              <div className="mt-1 text-xs font-semibold text-white/80">{new Date().toISOString().slice(0, 10)}</div>
            </div>
          </div>
        </div>

        {/* Subtle border highlight */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${safeAccent}22` }} />
      </motion.div>
    );
  })
);

function StatPill(props: { label: string; value: string; hint: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-white/70">{props.label}</div>
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: props.accent, boxShadow: `0 0 14px ${props.accent}55` }} />
      </div>
      <div className="mt-1 text-2xl font-extrabold text-white">{props.value}</div>
      <div className="mt-0.5 text-xs text-white/55">{props.hint}</div>
    </div>
  );
}

function ProgressRow(props: {
  label: string;
  progress: number;
  left: string;
  right: string;
  color: string;
}) {
  const pct = Math.round(clamp01(props.progress) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/65">
        <span className="truncate">{props.label}</span>
        <span className="shrink-0">{props.left} / {props.right} · {pct}%</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${props.color}, ${props.color}66)` }}
        />
      </div>
    </div>
  );
}

function MiniKpi(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/55">{props.label}</div>
      <div className="mt-1 text-base font-extrabold text-white">{props.value}</div>
    </div>
  );
}
