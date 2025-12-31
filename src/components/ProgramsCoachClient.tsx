'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Award, Calendar, CheckCircle2, ClipboardList, Save, Star, Users, XCircle } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ProgramsCoachClient({ locale, dict }: ProgramsCoachClientProps) {
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
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [attendanceSummaryByUserId, setAttendanceSummaryByUserId] = useState<
    Record<string, { attended: number; marked: number }>
  >({});

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

  const saveAttendance = async () => {
    if (!selectedProgramId) return;

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

      toast.success(dict.common?.saved || dict.common?.success || 'Saved');
    } catch (e) {
      console.error(e);
      toast.error(dict.common?.error || 'Failed to save attendance');
    } finally {
      setAttendanceSaving(false);
    }
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
      // academyId is derived server-side in requireAcademyContext; we pass it to keep the API consistent.
      // Coach access is validated inside the action.
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

  const shell = 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-3xl shadow-lg relative overflow-hidden';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="space-y-6"
    >
      <div className={`${shell} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 0.8 }}>
                <ClipboardList className="h-7 w-7 text-[#FF5F02]" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white">
                {t.title}
              </h1>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="min-w-[260px]">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t?.selectedProgram || 'Program'}</Label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={loadingPrograms}>
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder={t?.selectedProgram || 'Select a program'} />
                </SelectTrigger>
                <SelectContent className="border-2">
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {(locale === 'ar' ? p.nameAr : p.name) || p.name || p.nameAr || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t.sessionDateLabel}</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="h-12 pl-11 border-2"
                />
              </div>
            </div>

            <div className="self-end">
              <Button
                onClick={() => void saveAttendance()}
                disabled={!selectedProgramId || attendanceSaving || attendanceLoading}
                className="h-12 rounded-xl bg-[#0b0b0f] text-white hover:bg-[#14141a]"
              >
                <Save className="h-4 w-4 mr-2" />
                {dict.common.save}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{
            key: 'total',
            label: t?.membersTitle || 'Members',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
          }, {
            key: 'present',
            label: dict.courses.present,
            value: stats.present,
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
          }, {
            key: 'absent',
            label: dict.courses.absent,
            value: stats.absent,
            icon: XCircle,
            color: 'text-rose-600 dark:text-rose-400',
          }].map((s, idx) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl bg-gray-50 dark:bg-black/30 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{s.label}</div>
                  <div className="text-2xl font-black text-[#262626] dark:text-white">{s.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${shell} overflow-hidden`}>
          <CardHeader className="border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#FF5F02]" />
              {t?.membersTitle || 'Members'}
            </CardTitle>
            <CardDescription>
              {selectedProgram
                ? ((locale === 'ar' ? selectedProgram.nameAr : selectedProgram.name) || selectedProgram.name || selectedProgram.nameAr)
                : (t?.selectedProgram || 'Select a program')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loadingPrograms || loadingMembers ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{dict.common.loading}</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t.noMembers}</div>
            ) : (
              <AnimatePresence>
                {members.map((m, idx) => {
                  const name = m.user?.fullName || m.user?.username || m.userId;
                  const lvl = m.currentLevel;
                  const lvlName = lvl ? ((locale === 'ar' ? lvl.nameAr : lvl.name) || lvl.name || lvl.nameAr) : null;

                  const isPresent = attendance[m.userId]?.present ?? false;
                  const points = m.pointsTotal ?? 0;
                  const sessionsAttended = attendanceSummaryByUserId[m.userId]?.attended ?? 0;

                  return (
                    <motion.div
                      key={m.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ scale: 1.01 }}
                      className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-[#262626] dark:text-white truncate">{name}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge className="border-2 border-[#DDDDDD] bg-white text-[#262626] dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white">
                              {dict.programs.pointsLabel}: {points}
                            </Badge>
                            <Badge className="border-2 border-[#DDDDDD] bg-white text-[#262626] dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white">
                              {t.sessionsAttendedLabel}: {sessionsAttended}
                            </Badge>
                            {lvlName ? (
                              <Badge className="bg-white/10 text-white border-white/15">
                                {t.currentLevelLabel}: {lvlName}
                              </Badge>
                            ) : (
                              <Badge className="bg-white/10 text-white/70 border-white/10">{t.noLevel}</Badge>
                            )}
                          </div>

                          {lvl?.passRules ? (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {typeof lvl.passRules.minSessionsAttended === 'number' || typeof lvl.passRules.minPointsEarned === 'number' ? (
                                <div className="flex flex-wrap gap-2">
                                  {typeof lvl.passRules.minSessionsAttended === 'number' ? (
                                    <span>
                                      {t.minSessionsAttendedLabel}: <b>{lvl.passRules.minSessionsAttended}</b>
                                    </span>
                                  ) : null}
                                  {typeof lvl.passRules.minPointsEarned === 'number' ? (
                                    <span>
                                      {(t as any).minPointsEarnedLabel ?? (t as any).minXpEarnedLabel ?? 'Min points'}: <b>{lvl.passRules.minPointsEarned}</b>
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => togglePresent(m.userId)}
                            disabled={attendanceLoading || attendanceSaving}
                            className={`h-11 px-4 rounded-xl font-semibold border-2 transition-colors ${
                              isPresent
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-white dark:bg-[#1a1a1a] text-[#262626] dark:text-white border-[#DDDDDD] dark:border-[#000000]'
                            }`}
                          >
                            {isPresent ? dict.courses.present : dict.courses.absent}
                          </motion.button>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openNoteDialog(m)} className="h-10 border-2">
                              <Star className="h-4 w-4 mr-1" />
                              {t.addNote}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openBadgeDialog(m)} className="h-10 border-2">
                              <Award className="h-4 w-4 mr-1" />
                              {dict.playerProfile.actions.grantBadge}
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-10 border-2">
                              <Link href={`/${locale}/dashboard/players/${m.userId}`}>{dict.common.view}</Link>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">{dict.common.notes}</Label>
                        <Input
                          value={attendance[m.userId]?.notes ?? ''}
                          onChange={(e) =>
                            setAttendance((prev) => ({
                              ...prev,
                              [m.userId]: { ...prev[m.userId], notes: e.target.value },
                            }))
                          }
                          disabled={attendanceLoading || attendanceSaving}
                          className="h-11 border-2"
                          placeholder={dict.common.optional}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        <Card className={`${shell} overflow-hidden`}>
          <CardHeader className="border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#FF5F02]" />
              {t.coachToolsTitle}
            </CardTitle>
            <CardDescription>
              {t.coachToolsHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                <b>{t.rulesTitle}</b>: {t.rulesHint}
              </p>
              <p>
                Points are stored per program enrollment. Coaches can add points via notes.
              </p>
              <p>
                Attendance is stored per program per session date.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{t.addNoteTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t.pointsDeltaLabel}</Label>
              <Input
                inputMode="numeric"
                value={notePointsDelta}
                onChange={(e) => setNotePointsDelta(e.target.value)}
                placeholder={t.pointsDeltaHint}
                className="h-12 border-2"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t.commentLabel}</Label>
              <Textarea
                value={noteComment}
                onChange={(e) => setNoteComment(e.target.value)}
                placeholder={t.commentHint}
                className="min-h-[120px] border-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-12 border-2" onClick={() => setNoteDialogOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]" onClick={() => void submitNote()} disabled={noteSubmitting}>
              {dict.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{dict.playerProfile.actions.grantBadge}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{dict.playerProfile.labels.selectBadge}</Label>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder={dict.playerProfile.placeholders.selectBadge} />
                </SelectTrigger>
                <SelectContent className="border-2">
                  {BADGES.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Badge names are localized on the player profile.
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{dict.common.optional}</Label>
              <Input value={badgeNotes} onChange={(e) => setBadgeNotes(e.target.value)} className="h-12 border-2" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-12 border-2" onClick={() => setBadgeDialogOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
              onClick={() => void submitBadge()}
              disabled={badgeSubmitting || !selectedBadgeId}
            >
              {dict.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(attendanceLoading || attendanceSaving) && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {attendanceLoading ? dict.common.loading : dict.common.saving}
        </div>
      )}
    </motion.div>
  );
}
