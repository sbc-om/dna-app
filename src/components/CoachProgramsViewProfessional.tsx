'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Award, Calendar, CheckCircle2, Star, Users, XCircle, Sparkles, Trophy, Target, Medal, Zap, Clock, Check } from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Program } from '@/lib/db/repositories/programRepository';
import type { User } from '@/lib/db/repositories/userRepository';
import type { ProgramLevel } from '@/lib/db/repositories/programLevelRepository';
import { BADGES } from '@/lib/player/badges';
import { getProgramsAction } from '@/lib/actions/programActions';
import {
  addCoachNoteToProgramPlayerAction,
  listProgramMembersForCoachAction,
} from '@/lib/actions/programEnrollmentActions';
import {
  getProgramAttendanceAction,
  getProgramAttendanceSummaryForProgramAction,
  saveProgramAttendanceAction,
} from '@/lib/actions/programAttendanceActions';
import { grantPlayerBadgeAction } from '@/lib/actions/playerProfileActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface ProgramsCoachClientProps {
  locale: Locale;
  dict: Dictionary;
}

type ProgramMember = {
  id: string;
  academyId: string;
  programId: string;
  userId: string;
  status: string;
  joinedAt: string;
  currentLevelId?: string;
  pointsTotal: number;
  coachNotes?: Array<{ id: string; createdAt: string; pointsDelta?: number; comment?: string }>;
  user: User | null;
  currentLevel: ProgramLevel | null;
};

type AttendanceState = Record<string, { present: boolean; notes?: string }>;

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

export default function CoachProgramsViewProfessional({ locale, dict }: ProgramsCoachClientProps) {
  const t = dict.programs;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) || null,
    [programs, selectedProgramId]
  );

  const [members, setMembers] = useState<ProgramMember[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [sessionDate, setSessionDate] = useState<string>(todayISODate());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [attendanceSummaryByUserId, setAttendanceSummaryByUserId] = useState<
    Record<string, { attended: number; marked: number }>
  >({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ProgramMember | null>(null);
  const [notePointsDelta, setNotePointsDelta] = useState('');
  const [noteComment, setNoteComment] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [badgeTarget, setBadgeTarget] = useState<ProgramMember | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [badgeNotes, setBadgeNotes] = useState('');
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);

  const cardShell = 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const subtleText = 'text-gray-600 dark:text-gray-400';
  const fieldLabelClass = 'text-sm font-semibold text-[#262626] dark:text-white';
  const inputClass = 'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const textareaClass = 'min-h-[120px] bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';

  const loadPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const res = await getProgramsAction(locale);
      if (!res.success || !res.programs) {
        toast.error(res.error || dict.common?.error || 'Failed to load programs');
        setPrograms([]);
        return;
      }
      setPrograms(res.programs);
      setSelectedProgramId((cur) => cur || res.programs[0]?.id || '');
    } catch (e) {
      console.error(e);
      toast.error(dict.common?.error || 'Failed to load programs');
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  }, [dict.common?.error, locale]);

  const loadMembers = useCallback(
    async (programId: string) => {
      setLoadingMembers(true);
      try {
        const res = await listProgramMembersForCoachAction(programId, locale);
        if (!res.success || !res.members) {
          toast.error(res.error || dict.common?.error || 'Failed to load members');
          setMembers([]);
          return;
        }
        setMembers(res.members as ProgramMember[]);
      } catch (e) {
        console.error(e);
        toast.error(dict.common?.error || 'Failed to load members');
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    },
    [dict.common?.error, locale]
  );

  const loadAttendance = useCallback(
    async (programId: string, date: string) => {
      setAttendanceLoading(true);
      try {
        const res = await getProgramAttendanceAction({ locale, programId, sessionDate: date });
        if (!res.success) {
          toast.error(res.error || dict.common?.error || 'Failed to load attendance');
          return;
        }

        const next: AttendanceState = {};
        for (const m of members) {
          next[m.userId] = { present: false };
        }

        for (const r of res.records) {
          next[r.userId] = { present: !!r.present, notes: r.notes };
        }

        setAttendance(next);
      } catch (e) {
        console.error(e);
        toast.error(dict.common?.error || 'Failed to load attendance');
      } finally {
        setAttendanceLoading(false);
      }
    },
    [dict.common?.error, locale, members]
  );

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgramId) return;
    void loadMembers(selectedProgramId);
  }, [loadMembers, selectedProgramId]);

  useEffect(() => {
    if (!selectedProgramId) return;
    if (members.length === 0) {
      setAttendanceSummaryByUserId({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getProgramAttendanceSummaryForProgramAction({ locale, programId: selectedProgramId });
        if (cancelled) return;
        if (!res.success) return;
        setAttendanceSummaryByUserId(res.byUserId);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, members.length, selectedProgramId]);

  useEffect(() => {
    if (!selectedProgramId) return;
    if (members.length === 0) {
      setAttendance({});
      return;
    }
    void loadAttendance(selectedProgramId, sessionDate);
  }, [loadAttendance, members.length, selectedProgramId, sessionDate]);

  const togglePresent = (userId: string) => {
    setAttendance((prev) => {
      const next = { ...prev };
      next[userId] = { ...next[userId], present: !(next[userId]?.present ?? false) };
      return next;
    });
  };

  const saveAttendanceInternal = useCallback(async () => {
    if (!selectedProgramId || members.length === 0) return;

    setAttendanceSaving(true);
    try {
      const entries = members.map((m) => ({
        userId: m.userId,
        present: attendance[m.userId]?.present ?? false,
        notes: attendance[m.userId]?.notes,
      }));

      const res = await saveProgramAttendanceAction({
        locale,
        programId: selectedProgramId,
        sessionDate,
        entries,
      });

      if (!res.success) {
        toast.error(res.error || dict.common?.error || 'Failed to save attendance');
        return;
      }

      setLastSaved(new Date());
    } catch (e) {
      console.error(e);
      toast.error(dict.common?.error || 'Failed to save attendance');
    } finally {
      setAttendanceSaving(false);
    }
  }, [selectedProgramId, members, attendance, sessionDate, locale, dict.common?.error]);

  // Auto-save with debounce
  useEffect(() => {
    if (!selectedProgramId || members.length === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      void saveAttendanceInternal();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [attendance, selectedProgramId, members.length, saveAttendanceInternal]);

  const saveAttendance = async () => {
    // This function is now only used for manual saves if needed
    await saveAttendanceInternal();
  };

  const openNoteDialog = (member: ProgramMember) => {
    setNoteTarget(member);
    setNotePointsDelta('');
    setNoteComment('');
    setNoteDialogOpen(true);
  };

  const submitNote = async () => {
    if (!noteTarget || !selectedProgramId) return;

    const rawDelta = notePointsDelta.trim();
    const pointsDelta = rawDelta.length ? Number(rawDelta) : undefined;
    if (rawDelta.length) {
      if (!Number.isFinite(pointsDelta) || Math.abs(pointsDelta as number) > 100000) {
        toast.error(t?.invalidPointsDelta || dict.common?.error || 'Invalid points');
        return;
      }
    }

    const comment = noteComment.trim() ? noteComment.trim() : undefined;
    if (!comment && typeof pointsDelta !== 'number') {
      toast.error(t?.noteRequired || 'Add a comment or points.');
      return;
    }

    setNoteSubmitting(true);
    try {
      const res = await addCoachNoteToProgramPlayerAction({
        locale,
        programId: selectedProgramId,
        userId: noteTarget.userId,
        pointsDelta: typeof pointsDelta === 'number' ? pointsDelta : undefined,
        comment,
      });

      if (!res.success) {
        toast.error(res.error || dict.common?.error || 'Failed to save');
        return;
      }

      toast.success(dict.common?.success || 'Saved');
      setNoteDialogOpen(false);
      setNoteTarget(null);
      await loadMembers(selectedProgramId);
    } catch (e) {
      console.error(e);
      toast.error(dict.common?.error || 'Failed');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const openBadgeDialog = (member: ProgramMember) => {
    setBadgeTarget(member);
    setSelectedBadgeId('');
    setBadgeNotes('');
    setBadgeDialogOpen(true);
  };

  const submitBadge = async () => {
    if (!badgeTarget || !selectedBadgeId) return;

    setBadgeSubmitting(true);
    try {
      const res = await grantPlayerBadgeAction({
        locale,
        academyId: badgeTarget.academyId,
        userId: badgeTarget.userId,
        badgeId: selectedBadgeId,
        notes: badgeNotes.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || dict.common?.error || 'Failed');
        return;
      }

      toast.success(dict.common?.success || 'Granted');
      setBadgeDialogOpen(false);
      setBadgeTarget(null);
    } catch (e) {
      console.error(e);
      toast.error(dict.common?.error || 'Failed');
    } finally {
      setBadgeSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = members.length;
    const present = members.filter((m) => attendance[m.userId]?.present).length;
    return { total, present, absent: Math.max(0, total - present) };
  }, [attendance, members]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6"
    >
      {/* Professional Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/95 dark:bg-[#262626]/95 backdrop-blur-xl shadow-xl"
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white">
                {t?.title || 'Programs'}
              </h1>
              <p className={`${subtleText} mt-2`}>{t?.description || 'Manage attendance and track progress'}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className={`${fieldLabelClass} flex items-center gap-2`}>
                    <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    {t?.selectedProgram || 'Selected program'}
                  </Label>
                  <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={loadingPrograms}>
                    <SelectTrigger className={`${inputClass} rounded-xl`}>
                      <SelectValue placeholder={t?.selectedProgram || 'Select program'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {(locale === 'ar' ? p.nameAr : p.name) || p.name || p.nameAr || p.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={`${fieldLabelClass} flex items-center gap-2`}>
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    {t?.sessionDateLabel || 'Session date'}
                  </Label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className={`${inputClass} rounded-xl`}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            key: 'total',
            label: t?.membersTitle || 'Total Members',
            value: stats.total,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            textColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            key: 'present',
            label: dict.courses?.present || 'Present',
            value: stats.present,
            icon: CheckCircle2,
            color: 'from-emerald-500 to-green-500',
            textColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            key: 'absent',
            label: dict.courses?.absent || 'Absent',
            value: stats.absent,
            icon: XCircle,
            color: 'from-rose-500 to-pink-500',
            textColor: 'text-rose-600 dark:text-rose-400',
          },
        ].map((s, idx) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, rotateY: 2 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Card className={`${cardShell} overflow-hidden`}>
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-5`}
                animate={{ opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${subtleText} mb-2`}>{s.label}</div>
                    <div className={`text-4xl font-black ${s.textColor}`}>{s.value}</div>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center`}
                  >
                    <s.icon className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Members Grid */}
      <Card className={cardShell}>
        <div className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#262626] dark:text-white">
                {t?.membersTitle || 'Members'}
              </h2>
              <p className={`text-sm ${subtleText}`}>
                {selectedProgram
                  ? (locale === 'ar' ? selectedProgram.nameAr : selectedProgram.name) || selectedProgram.name || selectedProgram.nameAr
                  : t?.selectedProgram || 'Select a program'}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {loadingPrograms || loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-purple-600"
              />
              <span className="ml-3 text-sm text-gray-600 dark:text-white/70">{dict.common?.loading || 'Loading...'}</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000]">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <p className="text-[#262626] dark:text-white font-bold">{t?.noMembers || 'No members yet'}</p>
              <p className={`text-sm mt-2 ${subtleText}`}>Members will appear here once enrolled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {members.map((m, idx) => {
                  const name = m.user?.fullName || m.user?.username || m.userId;
                  const lvl = m.currentLevel;
                  const lvlName = lvl ? ((locale === 'ar' ? lvl.nameAr : lvl.name) || lvl.name || lvl.nameAr) : null;
                  const isPresent = attendance[m.userId]?.present ?? false;
                  const points = m.pointsTotal ?? 0;
                  const sessionsAttended = attendanceSummaryByUserId[m.userId]?.attended ?? 0;
                  const profilePicture = m.user?.profilePicture;

                  return (
                    <motion.div
                      key={m.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1 }}
                      style={{ transformStyle: 'preserve-3d' }}
                      className={`${cardShell} p-5 group`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-50"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />

                      <div className="relative space-y-4">
                        {/* Player Header */}
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="relative shrink-0"
                          >
                            {profilePicture ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md opacity-75" />
                                <img
                                  src={profilePicture}
                                  alt={name}
                                  className="relative w-20 h-20 rounded-2xl object-cover border-3 border-white dark:border-[#FF5F02] shadow-lg"
                                />
                                {isPresent && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111114] flex items-center justify-center shadow-lg"
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            ) : (
                              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-3 border-white dark:border-[#FF5F02] shadow-lg">
                                <span className="text-2xl font-bold text-white">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                                {isPresent && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111114] flex items-center justify-center shadow-lg"
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="font-black text-lg text-[#262626] dark:text-white truncate mb-2">{name}</div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="border-2 border-[#DDDDDD] bg-gradient-to-r from-blue-50 to-purple-50 text-[#262626] dark:border-[#000000] dark:from-blue-900/30 dark:to-purple-900/30 dark:text-white font-semibold">
                                <Star className="w-3 h-3 mr-1" />
                                {points} {dict.programs?.pointsLabel || 'pts'}
                              </Badge>
                              <Badge className="border-2 border-[#DDDDDD] bg-gradient-to-r from-emerald-50 to-teal-50 text-[#262626] dark:border-[#000000] dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-white font-semibold">
                                <Target className="w-3 h-3 mr-1" />
                                {sessionsAttended}
                              </Badge>
                              {lvlName && (
                                <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 font-semibold">
                                  <Medal className="w-3 h-3 mr-1" />
                                  {lvlName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attendance Toggle */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePresent(m.userId)}
                          disabled={attendanceLoading || attendanceSaving}
                          className={`w-full h-12 rounded-xl font-bold border-2 transition-all ${
                            isPresent
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30'
                              : 'bg-white dark:bg-[#1a1a1a] text-[#262626] dark:text-white border-[#DDDDDD] dark:border-[#000000]'
                          }`}
                        >
                          {isPresent ? (
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              {dict.courses?.present || 'Present'}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <XCircle className="h-5 w-5" />
                              {dict.courses?.absent || 'Mark as Present'}
                            </span>
                          )}
                        </motion.button>

                        {/* Notes Input */}
                        <div className="space-y-2">
                          <Label className={`text-xs ${subtleText}`}>{dict.common?.notes || 'Session Notes'}</Label>
                          <Input
                            value={attendance[m.userId]?.notes ?? ''}
                            onChange={(e) =>
                              setAttendance((prev) => ({
                                ...prev,
                                [m.userId]: { ...prev[m.userId], notes: e.target.value },
                              }))
                            }
                            disabled={attendanceLoading || attendanceSaving}
                            className={inputClass}
                            placeholder={dict.common?.optional || 'Optional notes...'}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNoteDialog(m)}
                            className="h-10 border-2 border-blue-500/40 bg-white/80 dark:bg-[#111114] text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1a1a1d]"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Points
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBadgeDialog(m)}
                            className="h-10 border-2 border-purple-500/40 bg-white/80 dark:bg-[#111114] text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-[#1a1a1d]"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            Badge
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-10 border-2 border-gray-500/40 bg-white/80 dark:bg-[#111114] text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1d]"
                          >
                            <Link href={`/${locale}/dashboard/players/${m.userId}`}>
                              {dict.common?.view || 'View'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Auto-save Indicator at Bottom of Content */}
          <AnimatePresence>
            {attendanceSaving && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/95 dark:bg-[#262626]/95 backdrop-blur-xl"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-purple-600"
                />
                <span className={`text-sm font-semibold ${subtleText}`}>Saving...</span>
              </motion.div>
            )}
            {!attendanceSaving && lastSaved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/95 dark:bg-emerald-900/30 backdrop-blur-xl"
              >
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Auto-saved {new Date(lastSaved).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[560px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {t?.addNoteTitle || 'Add Points & Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={fieldLabelClass}>{t?.pointsDeltaLabel || 'Points'}</Label>
              <Input
                inputMode="numeric"
                value={notePointsDelta}
                onChange={(e) => setNotePointsDelta(e.target.value)}
                placeholder={t?.pointsDeltaHint || 'e.g. +10 or -5'}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={fieldLabelClass}>{t?.commentLabel || 'Comment'}</Label>
              <Textarea
                value={noteComment}
                onChange={(e) => setNoteComment(e.target.value)}
                placeholder={t?.commentHint || 'Add a comment...'}
                className={textareaClass}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-12 border-2" onClick={() => setNoteDialogOpen(false)}>
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
              onClick={() => void submitNote()}
              disabled={noteSubmitting}
            >
              {dict.common?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="sm:max-w-[560px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {dict.playerProfile?.actions?.grantBadge || 'Grant Badge'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={fieldLabelClass}>{dict.playerProfile?.labels?.selectBadge || 'Select Badge'}</Label>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger className={`${inputClass} rounded-xl`}>
                  <SelectValue placeholder={dict.playerProfile?.placeholders?.selectBadge || 'Choose a badge'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  {BADGES.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={fieldLabelClass}>{dict.common?.notes || 'Notes (Optional)'}</Label>
              <Input
                value={badgeNotes}
                onChange={(e) => setBadgeNotes(e.target.value)}
                className={inputClass}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-12 border-2" onClick={() => setBadgeDialogOpen(false)}>
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
              onClick={() => void submitBadge()}
              disabled={badgeSubmitting || !selectedBadgeId}
            >
              {dict.common?.save || 'Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
