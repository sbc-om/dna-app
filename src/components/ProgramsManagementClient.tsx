'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/config/i18n';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Program } from '@/lib/db/repositories/programRepository';
import type { ProgramLevel, ProgramLevelPassRules } from '@/lib/db/repositories/programLevelRepository';
import {
  createProgramAction,
  createProgramLevelAction,
  deleteProgramAction,
  deleteProgramLevelAction,
  getProgramLevelsAction,
  getProgramsAction,
  moveProgramLevelAction,
  updateProgramAction,
  updateProgramLevelAction,
} from '@/lib/actions/programActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export interface ProgramsManagementClientProps {
  locale: Locale;
  dict: Dictionary;
}

type ProgramFormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  isActive: boolean;
};

type LevelFormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  minDaysInLevel: string;
  minAttendanceRatePercent: string;
  minNaImprovementPercent: string;
};

function parseOptionalNumber(value: string): number | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function rulesToForm(rules: ProgramLevelPassRules | undefined): Pick<LevelFormState, 'minDaysInLevel' | 'minAttendanceRatePercent' | 'minNaImprovementPercent'> {
  return {
    minDaysInLevel: typeof rules?.minDaysInLevel === 'number' ? String(rules.minDaysInLevel) : '',
    minAttendanceRatePercent:
      typeof rules?.minAttendanceRatePercent === 'number' ? String(rules.minAttendanceRatePercent) : '',
    minNaImprovementPercent:
      typeof rules?.minNaImprovementPercent === 'number' ? String(rules.minNaImprovementPercent) : '',
  };
}

function formToRules(form: LevelFormState): ProgramLevelPassRules {
  return {
    minDaysInLevel: parseOptionalNumber(form.minDaysInLevel),
    minAttendanceRatePercent: parseOptionalNumber(form.minAttendanceRatePercent),
    minNaImprovementPercent: parseOptionalNumber(form.minNaImprovementPercent),
  };
}

export default function ProgramsManagementClient({ locale, dict }: ProgramsManagementClientProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<ProgramLevel[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);

  const [activeTab, setActiveTab] = useState<'programs' | 'levels'>('programs');

  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programForm, setProgramForm] = useState<ProgramFormState>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    isActive: true,
  });

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ProgramLevel | null>(null);
  const [levelForm, setLevelForm] = useState<LevelFormState>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    minDaysInLevel: '',
    minAttendanceRatePercent: '',
    minNaImprovementPercent: '',
  });

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) || null : null),
    [programs, selectedProgramId]
  );

  const t = dict.programs;

  const loadPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const result = await getProgramsAction(locale);
      if (!result.success || !result.programs) {
        toast.error(result.error || dict.common?.error || 'Failed to load programs');
        setPrograms([]);
        return;
      }

      setPrograms(result.programs);

      // Keep selection stable when possible
      setSelectedProgramId((cur) => {
        if (!cur) return result.programs[0]?.id || null;
        const stillExists = result.programs.some((p) => p.id === cur);
        return stillExists ? cur : result.programs[0]?.id || null;
      });
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error(dict.common?.error || 'Failed to load programs');
    } finally {
      setLoadingPrograms(false);
    }
  }, [dict.common?.error, locale]);

  const loadLevels = useCallback(
    async (programId: string) => {
      setLoadingLevels(true);
      try {
        const result = await getProgramLevelsAction(programId, locale);
        if (!result.success || !result.levels) {
          toast.error(result.error || dict.common?.error || 'Failed to load levels');
          setLevels([]);
          return;
        }
        setLevels(result.levels);
      } catch (error) {
        console.error('Error loading levels:', error);
        toast.error(dict.common?.error || 'Failed to load levels');
      } finally {
        setLoadingLevels(false);
      }
    },
    [dict.common?.error, locale]
  );

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgramId) {
      setLevels([]);
      return;
    }
    void loadLevels(selectedProgramId);
  }, [loadLevels, selectedProgramId]);

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({ name: '', nameAr: '', description: '', descriptionAr: '', isActive: true });
    setProgramDialogOpen(true);
  };

  const openEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name || '',
      nameAr: program.nameAr || '',
      description: program.description || '',
      descriptionAr: program.descriptionAr || '',
      isActive: program.isActive,
    });
    setProgramDialogOpen(true);
  };

  const saveProgram = async () => {
    const name = programForm.name.trim();
    const nameAr = programForm.nameAr.trim();

    if (!name || !nameAr) {
      toast.error(dict.validation?.required || 'This field is required');
      return;
    }

    try {
      if (editingProgram) {
        const result = await updateProgramAction(
          editingProgram.id,
          {
            name,
            nameAr,
            description: programForm.description.trim() || undefined,
            descriptionAr: programForm.descriptionAr.trim() || undefined,
            isActive: programForm.isActive,
          },
          locale
        );

        if (!result.success) {
          toast.error(result.error || dict.common?.error || 'Failed to save');
          return;
        }

        toast.success(dict.common?.saved || dict.common?.success || 'Saved');
      } else {
        const result = await createProgramAction(
          {
            name,
            nameAr,
            description: programForm.description.trim() || undefined,
            descriptionAr: programForm.descriptionAr.trim() || undefined,
          },
          locale
        );

        if (!result.success) {
          toast.error(result.error || dict.common?.error || 'Failed to create');
          return;
        }

        toast.success(dict.common?.created || dict.common?.success || 'Created');
      }

      setProgramDialogOpen(false);
      await loadPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error(dict.common?.error || 'Failed to save');
    }
  };

  const confirmDeleteProgram = async (program: Program) => {
    const ok = confirm(t?.confirmDeleteProgram || dict.common?.confirmDelete || 'Are you sure?');
    if (!ok) return;

    try {
      const result = await deleteProgramAction(program.id, locale);
      if (!result.success) {
        toast.error(result.error || dict.common?.error || 'Failed to delete');
        return;
      }
      toast.success(dict.common?.deleted || dict.common?.success || 'Deleted');
      await loadPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(dict.common?.error || 'Failed to delete');
    }
  };

  const openCreateLevel = () => {
    if (!selectedProgramId) return;
    setEditingLevel(null);
    setLevelForm({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      minDaysInLevel: '',
      minAttendanceRatePercent: '',
      minNaImprovementPercent: '',
    });
    setLevelDialogOpen(true);
  };

  const openEditLevel = (level: ProgramLevel) => {
    setEditingLevel(level);
    const rules = rulesToForm(level.passRules);
    setLevelForm({
      name: level.name || '',
      nameAr: level.nameAr || '',
      description: level.description || '',
      descriptionAr: level.descriptionAr || '',
      ...rules,
    });
    setLevelDialogOpen(true);
  };

  const saveLevel = async () => {
    if (!selectedProgramId) return;

    const name = levelForm.name.trim();
    const nameAr = levelForm.nameAr.trim();

    if (!name || !nameAr) {
      toast.error(dict.validation?.required || 'This field is required');
      return;
    }

    const rules = formToRules(levelForm);

    try {
      if (editingLevel) {
        const result = await updateProgramLevelAction(
          editingLevel.id,
          {
            name,
            nameAr,
            description: levelForm.description.trim() || undefined,
            descriptionAr: levelForm.descriptionAr.trim() || undefined,
            passRules: rules,
          },
          locale
        );

        if (!result.success) {
          toast.error(result.error || dict.common?.error || 'Failed to save');
          return;
        }

        toast.success(dict.common?.saved || dict.common?.success || 'Saved');
      } else {
        const result = await createProgramLevelAction(
          {
            programId: selectedProgramId,
            name,
            nameAr,
            description: levelForm.description.trim() || undefined,
            descriptionAr: levelForm.descriptionAr.trim() || undefined,
            passRules: rules,
          },
          locale
        );

        if (!result.success) {
          toast.error(result.error || dict.common?.error || 'Failed to create');
          return;
        }

        toast.success(dict.common?.created || dict.common?.success || 'Created');
      }

      setLevelDialogOpen(false);
      await loadLevels(selectedProgramId);
    } catch (error) {
      console.error('Error saving level:', error);
      toast.error(dict.common?.error || 'Failed to save');
    }
  };

  const confirmDeleteLevel = async (level: ProgramLevel) => {
    const ok = confirm(t?.confirmDeleteLevel || dict.common?.confirmDelete || 'Are you sure?');
    if (!ok) return;

    try {
      const result = await deleteProgramLevelAction(level.id, locale);
      if (!result.success) {
        toast.error(result.error || dict.common?.error || 'Failed to delete');
        return;
      }
      toast.success(dict.common?.deleted || dict.common?.success || 'Deleted');
      if (selectedProgramId) await loadLevels(selectedProgramId);
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error(dict.common?.error || 'Failed to delete');
    }
  };

  const moveLevel = async (level: ProgramLevel, direction: 'up' | 'down') => {
    try {
      const result = await moveProgramLevelAction(level.id, direction, locale);
      if (!result.success) {
        toast.error(result.error || dict.common?.error || 'Failed');
        return;
      }
      if (result.levels) setLevels(result.levels);
    } catch (error) {
      console.error('Error moving level:', error);
      toast.error(dict.common?.error || 'Failed');
    }
  };

  const rulesBadges = (rules: ProgramLevelPassRules) => {
    const items: Array<{ key: string; label: string }> = [];
    if (typeof rules.minDaysInLevel === 'number') {
      items.push({ key: 'days', label: `${rules.minDaysInLevel}d` });
    }
    if (typeof rules.minAttendanceRatePercent === 'number') {
      items.push({ key: 'att', label: `${rules.minAttendanceRatePercent}%` });
    }
    if (typeof rules.minNaImprovementPercent === 'number') {
      items.push({ key: 'na', label: `NA +${rules.minNaImprovementPercent}%` });
    }

    if (items.length === 0) {
      return <Badge className="bg-white/10 text-white/70 border-white/10">—</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Badge key={i.key} className="bg-white/10 text-white border-white/15">
            {i.label}
          </Badge>
        ))}
      </div>
    );
  };

  if (loadingPrograms) {
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/10 via-purple-500/10 to-[#FF5F02]/15" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-linear-to-br from-[#FF5F02]/25 to-purple-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
              >
                <Layers className="h-5 w-5 text-[#FF5F02]" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t?.title || 'Programs'}</h1>
                <p className="mt-1 text-sm text-white/70">{t?.description || ''}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={openCreateProgram}
            className="h-11 rounded-2xl bg-linear-to-r from-[#FF5F02] to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-[#FF5F02]/90 hover:to-orange-600/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-semibold">{t?.createProgram || dict.common?.create || 'Create'}</span>
            <Sparkles className="h-4 w-4 ml-2 text-white/80" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">{t?.title || 'Programs'}</TabsTrigger>
          <TabsTrigger value="levels" disabled={!selectedProgramId}>
            {t?.levelsTitle || 'Levels'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {programs.length === 0 ? (
              <Card className="rounded-3xl border border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">{t?.noPrograms || 'No programs yet'}</CardTitle>
                  <CardDescription className="text-white/70">{t?.description || ''}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              programs.map((p, idx) => {
                const isSelected = selectedProgramId === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card
                      onClick={() => {
                        setSelectedProgramId(p.id);
                        setActiveTab('levels');
                      }}
                      className={
                        'cursor-pointer rounded-3xl border bg-white/5 transition-all ' +
                        (isSelected
                          ? 'border-[#FF5F02]/60 shadow-lg shadow-orange-500/10'
                          : 'border-white/10 hover:border-white/20')
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <CardTitle className="text-white truncate">{locale === 'ar' ? p.nameAr : p.name}</CardTitle>
                            <CardDescription className="text-white/70 line-clamp-2">
                              {locale === 'ar' ? p.descriptionAr : p.description}
                            </CardDescription>
                          </div>
                          <Badge className={p.isActive ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20' : 'bg-white/10 text-white/70 border-white/10'}>
                            {p.isActive ? (dict.common?.active || 'Active') : (dict.common?.inactive || 'Inactive')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{t?.levelsTitle || 'Levels'}: {levels.length && isSelected ? levels.length : '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEditProgram(p);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              {t?.editProgram || dict.common?.edit || 'Edit'}
                            </Button>
                            <Button
                              variant="destructive"
                              className="h-9 rounded-xl"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void confirmDeleteProgram(p);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t?.deleteProgram || dict.common?.delete || 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="levels">
          {!selectedProgram ? (
            <Card className="rounded-3xl border border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">{t?.selectProgramPrompt || 'Select a program'}</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="rounded-3xl border border-white/10 bg-white/5">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-white truncate">
                        {t?.levelsTitle || 'Levels'} — {locale === 'ar' ? selectedProgram.nameAr : selectedProgram.name}
                      </CardTitle>
                      <CardDescription className="text-white/70">{t?.rulesTitle || 'Pass Rules'}</CardDescription>
                    </div>
                    <Button
                      onClick={openCreateLevel}
                      className="h-10 rounded-2xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t?.createLevel || 'Create Level'}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {loadingLevels ? (
                <div className="flex items-center justify-center py-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-9 w-9 rounded-full border-2 border-white/10 border-t-[#FF5F02]"
                  />
                  <span className="ml-3 text-sm text-white/70">{dict.common?.loading || 'Loading...'}</span>
                </div>
              ) : levels.length === 0 ? (
                <Card className="rounded-3xl border border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">{t?.noLevels || 'No levels yet'}</CardTitle>
                    <CardDescription className="text-white/70">{t?.selectProgramPrompt || ''}</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence>
                    {levels.map((lvl, idx) => (
                      <motion.div
                        key={lvl.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
                          <CardContent className="relative pt-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-white/10 text-white border-white/15">#{lvl.order}</Badge>
                                  <h3 className="text-lg font-semibold text-white truncate">
                                    {locale === 'ar' ? lvl.nameAr : lvl.name}
                                  </h3>
                                </div>
                                {(lvl.description || lvl.descriptionAr) && (
                                  <p className="mt-2 text-sm text-white/70 line-clamp-2">
                                    {locale === 'ar' ? lvl.descriptionAr : lvl.description}
                                  </p>
                                )}
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-xs text-white/60">{t?.rulesTitle || 'Pass Rules'}:</span>
                                  {rulesBadges(lvl.passRules)}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                                  onClick={() => void moveLevel(lvl, 'up')}
                                  disabled={idx === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                                  onClick={() => void moveLevel(lvl, 'down')}
                                  disabled={idx === levels.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                                  onClick={() => openEditLevel(lvl)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t?.editLevel || dict.common?.edit || 'Edit'}
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="h-9 rounded-xl"
                                  onClick={() => void confirmDeleteLevel(lvl)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t?.deleteLevel || dict.common?.delete || 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {editingProgram ? (t?.editProgram || 'Edit Program') : (t?.createProgram || 'Create Program')}
            </DialogTitle>
            <DialogDescription>{t?.description || ''}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.nameEn || 'Name (English)'}</div>
              <Input value={programForm.name} onChange={(e) => setProgramForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.nameAr || 'Name (Arabic)'}</div>
              <Input value={programForm.nameAr} onChange={(e) => setProgramForm((p) => ({ ...p, nameAr: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.descriptionEn || 'Description (English)'}</div>
              <Textarea
                value={programForm.description}
                onChange={(e) => setProgramForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.descriptionAr || 'Description (Arabic)'}</div>
              <Textarea
                value={programForm.descriptionAr}
                onChange={(e) => setProgramForm((p) => ({ ...p, descriptionAr: e.target.value }))}
              />
            </div>
          </div>

          {editingProgram && (
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="text-sm font-medium">{dict.common?.status || 'Status'}</div>
                <div className="text-xs text-muted-foreground">{dict.common?.active || 'Active'} / {dict.common?.inactive || 'Inactive'}</div>
              </div>
              <Switch
                checked={programForm.isActive}
                onCheckedChange={(v) => setProgramForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={() => void saveProgram()} className="bg-linear-to-r from-[#FF5F02] to-orange-600 text-white">
              {dict.common?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {editingLevel ? (t?.editLevel || 'Edit Level') : (t?.createLevel || 'Create Level')}
            </DialogTitle>
            <DialogDescription>{t?.rulesTitle || 'Pass Rules'}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.levelNameEn || 'Level name (English)'}</div>
              <Input value={levelForm.name} onChange={(e) => setLevelForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.levelNameAr || 'Level name (Arabic)'}</div>
              <Input value={levelForm.nameAr} onChange={(e) => setLevelForm((p) => ({ ...p, nameAr: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.descriptionEn || 'Description (English)'}</div>
              <Textarea value={levelForm.description} onChange={(e) => setLevelForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{t?.fields?.descriptionAr || 'Description (Arabic)'}</div>
              <Textarea value={levelForm.descriptionAr} onChange={(e) => setLevelForm((p) => ({ ...p, descriptionAr: e.target.value }))} />
            </div>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t?.rulesTitle || 'Pass Rules'}
              </CardTitle>
              <CardDescription>
                {t?.rulesHint || ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">{t?.minDaysInLevel || 'Minimum days in level'}</div>
                <Input
                  inputMode="numeric"
                  value={levelForm.minDaysInLevel}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minDaysInLevel: e.target.value }))}
                  placeholder="e.g. 90"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">{t?.minAttendanceRate || 'Minimum attendance rate (%)'}</div>
                <Input
                  inputMode="numeric"
                  value={levelForm.minAttendanceRatePercent}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minAttendanceRatePercent: e.target.value }))}
                  placeholder="e.g. 70"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">{t?.minNaImprovementPercent || 'Minimum NA improvement (%)'}</div>
                <Input
                  inputMode="numeric"
                  value={levelForm.minNaImprovementPercent}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minNaImprovementPercent: e.target.value }))}
                  placeholder="e.g. 10"
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLevelDialogOpen(false)}>
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={() => void saveLevel()} className="bg-linear-to-r from-[#FF5F02] to-orange-600 text-white">
              {dict.common?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
