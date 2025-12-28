'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Users, Trash2, Search, ShieldCheck, MessageSquare, Star, Sparkles } from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Program } from '@/lib/db/repositories/programRepository';
import type { User } from '@/lib/db/repositories/userRepository';
import type { ProgramLevel } from '@/lib/db/repositories/programLevelRepository';
import {
  addPlayerToProgramAction,
  addCoachNoteToProgramPlayerAction,
  getAcademyPlayersForProgramsAction,
  listProgramMembersAction,
  removePlayerFromProgramAction,
} from '@/lib/actions/programEnrollmentActions';
import { getProgramsAction } from '@/lib/actions/programActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirm } from '@/components/ConfirmDialog';

export interface ProgramMembersClientProps {
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

export default function ProgramMembersClient({ locale, dict }: ProgramMembersClientProps) {
  const t = dict.programs;

  const { confirm, ConfirmDialog } = useConfirm();

  const cardShell =
    'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-3xl shadow-lg relative overflow-hidden';
  const inputClass =
    'h-12 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const outlineButtonClass =
    'h-11 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#111114] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1d]';
  const ctaButtonClass = 'h-11 rounded-xl bg-[#0b0b0f] text-white hover:bg-[#14141a]';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  const [members, setMembers] = useState<ProgramMember[]>([]);
  const [players, setPlayers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ProgramMember | null>(null);
  const [notePointsDelta, setNotePointsDelta] = useState<string>('');
  const [noteComment, setNoteComment] = useState<string>('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) || null,
    [programs, selectedProgramId]
  );

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProgramsAction(locale);
      if (!result.success || !result.programs) {
        toast.error(result.error || dict.common?.error || 'Failed');
        setPrograms([]);
        return;
      }
      setPrograms(result.programs);
      setSelectedProgramId((cur) => cur || result.programs[0]?.id || '');
    } catch (error) {
      console.error(error);
      toast.error(dict.common?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [dict.common?.error, locale]);

  const loadPlayers = useCallback(async () => {
    try {
      const result = await getAcademyPlayersForProgramsAction(locale);
      if (!result.success || !result.players) {
        setPlayers([]);
        return;
      }
      setPlayers(result.players);
    } catch (error) {
      console.error(error);
      setPlayers([]);
    }
  }, [locale]);

  const loadMembers = useCallback(
    async (programId: string) => {
      setLoadingMembers(true);
      try {
        const result = await listProgramMembersAction(programId, locale);
        if (!result.success || !result.members) {
          toast.error(result.error || dict.common?.error || 'Failed to load members');
          setMembers([]);
          return;
        }
        setMembers(result.members);
      } catch (error) {
        console.error(error);
        toast.error(dict.common?.error || 'Failed');
      } finally {
        setLoadingMembers(false);
      }
    },
    [dict.common?.error, locale]
  );

  useEffect(() => {
    void loadPrograms();
    void loadPlayers();
  }, [loadPrograms, loadPlayers]);

  useEffect(() => {
    if (!selectedProgramId) return;
    void loadMembers(selectedProgramId);
  }, [loadMembers, selectedProgramId]);

  const memberIdSet = useMemo(() => new Set(members.map((m) => m.userId)), [members]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = players.filter((p) => !memberIdSet.has(p.id));
    if (!q) return base;
    return base.filter((p) => {
      const name = (p.fullName || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const username = (p.username || '').toLowerCase();
      return name.includes(q) || email.includes(q) || username.includes(q);
    });
  }, [memberIdSet, players, search]);

  const addPlayer = async (userId: string) => {
    if (!selectedProgramId) return;
    const res = await addPlayerToProgramAction({ programId: selectedProgramId, userId, locale });
    if (!res.success) {
      toast.error(res.error || dict.common?.error || 'Failed');
      return;
    }
    toast.success(dict.common?.success || 'Added');
    await loadMembers(selectedProgramId);
  };

  const removePlayer = async (userId: string) => {
    if (!selectedProgramId) return;
    const member = members.find((m) => m.userId === userId) || null;
    const displayName = member?.user?.fullName || member?.user?.username || userId;

    const ok = await confirm({
      title: dict.common?.confirmDelete || 'Remove member',
      description: `This will remove ${displayName} from this program.\n\nThis action cannot be undone.`,
      confirmText: dict.common?.delete || 'Remove',
      cancelText: dict.common?.cancel || 'Cancel',
      variant: 'destructive',
    });
    if (!ok) return;

    const res = await removePlayerFromProgramAction({ programId: selectedProgramId, userId, locale });
    if (!res.success) {
      toast.error(res.error || dict.common?.error || 'Failed');
      return;
    }
    toast.success(dict.common?.deleted || dict.common?.success || 'Removed');
    await loadMembers(selectedProgramId);
  };

  const openNoteDialog = (member: ProgramMember) => {
    setNoteTarget(member);
    setNotePointsDelta('');
    setNoteComment('');
    setNoteDialogOpen(true);
  };

  const submitNote = async () => {
    if (!noteTarget) return;
    if (!selectedProgramId) return;

    const rawDelta = notePointsDelta.trim();
    const pointsDelta = rawDelta ? Number(rawDelta) : undefined;
    if (rawDelta) {
      const n = Number(rawDelta);
      if (!Number.isFinite(n) || Math.abs(n) > 100000) {
        toast.error(t?.invalidPointsDelta || 'Invalid points');
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
        toast.error(res.error || dict.common?.error || 'Failed');
        return;
      }

      toast.success(dict.common?.success || 'Saved');
      setNoteDialogOpen(false);
      setNoteTarget(null);
      await loadMembers(selectedProgramId);
    } catch (error) {
      console.error(error);
      toast.error(dict.common?.error || 'Failed');
    } finally {
      setNoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-white/10 border-t-[#FF5F02]"
        />
        <span className="ml-3 text-sm text-white/70">{dict.common?.loading || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6"
    >
      <Card className={cardShell}>
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FF5F02]/18 via-purple-500/10 to-transparent blur-3xl"
            animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-linear-to-tr from-blue-500/14 via-[#FF5F02]/10 to-transparent blur-3xl"
            animate={{ opacity: [0.5, 0.75, 0.5], scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <CardHeader className="relative pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-[#262626] dark:text-white flex items-center gap-3">
                <motion.div
                  className="h-11 w-11 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/70 dark:bg-white/5 backdrop-blur-sm flex items-center justify-center"
                  whileHover={{ rotate: -2, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  aria-hidden
                >
                  <Users className="h-5 w-5" />
                </motion.div>
                <span className="truncate">
                  {t?.title || 'Programs'} · {t?.membersTitle || 'Members'}
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t?.membersDescription || 'Add players to programs and manage memberships.'}
              </CardDescription>
            </div>

            <div className="w-full lg:w-auto">
              <Button asChild disabled={!selectedProgramId} className={ctaButtonClass}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAddDialogOpen(true)}
                  className="w-full lg:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t?.addPlayer || 'Add player'}
                </motion.button>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-5">
          {programs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#DDDDDD] dark:border-white/10 p-6 text-sm text-muted-foreground flex items-start gap-3">
              <Sparkles className="h-5 w-5 mt-0.5" />
              <div>
                <div className="font-semibold text-[#262626] dark:text-white">
                  {t?.noPrograms || 'No programs available'}
                </div>
                <div className="mt-1">
                  {'Create a program first, then you can add members here.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-2">
                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{t?.selectedProgram || 'Selected program'}</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder={'Select a program'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {locale === 'ar' ? p.nameAr : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center sm:justify-between lg:items-stretch lg:justify-start">
                <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50/70 dark:bg-[#111114] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {t?.membersCount || 'Members'}: {loadingMembers ? '…' : String(members.length)}
                    </span>
                  </div>
                  {selectedProgram?.isActive ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/20">
                      {dict.common?.active || 'Active'}
                    </Badge>
                  ) : (
                    <Badge className="bg-white/10 text-white/70 border-white/10">{dict.common?.inactive || 'Inactive'}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-9 w-9 rounded-full border-2 border-white/10 border-t-[#FF5F02]"
                />
                <span className="ml-3 text-sm text-white/70">{dict.common?.loading || 'Loading...'}</span>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#DDDDDD] dark:border-white/10 p-6 text-sm text-muted-foreground">
                {t?.noMembers || 'No players in this program yet.'}
              </div>
            ) : (
              <AnimatePresence>
                {members.map((m, idx) => (
                  <motion.div
                    key={`${m.programId}:${m.userId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] p-4 sm:p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0 flex items-start gap-3">
                        <motion.div
                          className="shrink-0 h-11 w-11 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center"
                          whileHover={{ rotate: [0, -3, 3, 0], scale: 1.02 }}
                          transition={{ duration: 0.5 }}
                          aria-hidden
                        >
                          <span className="text-sm font-black text-[#262626] dark:text-white">
                            {(m.user?.fullName || m.user?.username || 'U').slice(0, 1).toUpperCase()}
                          </span>
                        </motion.div>

                        <div className="min-w-0">
                          <div className="font-black text-[#262626] dark:text-white truncate">
                            {m.user?.fullName || m.user?.username || m.userId}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{m.user?.email || ''}</div>
                          {m.coachNotes?.[0]?.comment ? (
                            <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                              <span className="font-semibold">{t?.latestNote || 'Latest'}:</span> {m.coachNotes[0].comment}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="w-full lg:w-auto space-y-3">
                        <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                          <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-200 border-blue-600/20">
                            <Star className="h-3.5 w-3.5 mr-1" />
                            {t?.pointsLabel || 'Points'}: {m.pointsTotal}
                          </Badge>
                          {m.currentLevel ? (
                            <Badge className="bg-[#0b0b0f] text-white border-0">
                              {t?.currentLevel || 'Level'}: {locale === 'ar' ? m.currentLevel.nameAr : m.currentLevel.name}
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border border-border">{t?.noLevel || 'No level'}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:justify-end">
                          <Button asChild variant="outline" className={outlineButtonClass}>
                            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openNoteDialog(m)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {t?.addNote || 'Note'}
                            </motion.button>
                          </Button>
                          <Button asChild variant="destructive" className="h-11 rounded-xl">
                            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void removePlayer(m.userId)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              {dict.common?.delete || 'Remove'}
                            </motion.button>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open);
          if (!open) setNoteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[680px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white">
              {t?.addNoteTitle || 'Add coach note'}
            </DialogTitle>
            <DialogDescription>
              {noteTarget?.user?.fullName || noteTarget?.user?.username || noteTarget?.userId}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#262626] dark:text-white">{t?.pointsDeltaLabel || 'Points change'}</Label>
              <Input
                value={notePointsDelta}
                onChange={(e) => setNotePointsDelta(e.target.value)}
                className={inputClass}
                inputMode="numeric"
                placeholder={t?.pointsDeltaHint || 'e.g. 5 or -2'}
              />
              <p className="text-xs text-muted-foreground">{'Optional. Use negative numbers to subtract points.'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#262626] dark:text-white">{t?.commentLabel || 'Comment'}</Label>
              <Textarea
                value={noteComment}
                onChange={(e) => setNoteComment(e.target.value)}
                className="min-h-12 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder={t?.commentHint || 'Short coaching note'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button asChild variant="outline" disabled={noteSubmitting} className={outlineButtonClass}>
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setNoteDialogOpen(false)}>
                {dict.common?.cancel || 'Cancel'}
              </motion.button>
            </Button>
            <Button asChild disabled={noteSubmitting} className={ctaButtonClass}>
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void submitNote()}>
                {noteSubmitting ? (dict.common?.saving || 'Saving...') : (dict.common?.save || 'Save')}
              </motion.button>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[860px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white">
              {t?.addPlayer || 'Add player'}
            </DialogTitle>
            <DialogDescription>{t?.addPlayerHint || 'Search and add players from this academy.'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder={t?.searchPlayers || 'Search players by name, email, or username'}
              />
            </div>

            <div className="max-h-[420px] overflow-auto rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000]">
              {filteredPlayers.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">{t?.noPlayersToAdd || 'No players available to add.'}</div>
              ) : (
                <div className="divide-y divide-[#DDDDDD] dark:divide-white/10">
                  {filteredPlayers.slice(0, 100).map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#262626] dark:text-white truncate">
                          {p.fullName || p.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                      </div>
                      <Button asChild className="h-10 rounded-xl bg-[#0b0b0f] text-white hover:bg-[#14141a]">
                        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void addPlayer(p.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          {dict.common?.add || 'Add'}
                        </motion.button>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button asChild variant="outline" className={outlineButtonClass}>
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setAddDialogOpen(false)}>
                {dict.common?.cancel || 'Close'}
              </motion.button>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </motion.div>
  );
}
