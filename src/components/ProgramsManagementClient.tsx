'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Layers, Sparkles, ShieldCheck, Search } from 'lucide-react';
import Link from 'next/link';
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
import { ImageUpload } from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirm } from '@/components/ConfirmDialog';
import { DEFAULT_ACCENT_COLOR, normalizeHexColor, getDefaultProgramLevelColor } from '@/lib/theme/accentColors';

export interface ProgramsManagementClientProps {
  locale: Locale;
  dict: Dictionary;
}

type ProgramFormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  isActive: boolean;
};

type LevelFormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  color: string;
  minDaysInLevel: string;
  minAttendanceRatePercent: string;
  minNaImprovementPercent: string;
};

async function uploadCroppedImage(file: File, croppedImageUrl: string): Promise<string | null> {
  try {
    const uploadFormData = new FormData();

    // Convert cropped data URL to Blob
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    uploadFormData.append('file', blob, file.name);

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) return null;
    const data = await uploadResponse.json();
    return typeof data?.url === 'string' ? data.url : null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseOptionalInteger(value: string): number | undefined {
  const n = parseOptionalNumber(value);
  if (typeof n !== 'number') return undefined;
  if (!Number.isInteger(n)) return undefined;
  return n;
}

function clampPercent(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function validateRulesForm(form: LevelFormState): string | null {
  const minDaysRaw = form.minDaysInLevel.trim();
  if (minDaysRaw) {
    const parsed = parseOptionalInteger(minDaysRaw);
    if (typeof parsed !== 'number' || parsed < 0) return 'Minimum days must be a non-negative integer.';
  }

  const percentFields: Array<{ raw: string; label: string }> = [
    { raw: form.minAttendanceRatePercent.trim(), label: 'Minimum attendance rate' },
    { raw: form.minNaImprovementPercent.trim(), label: 'Minimum NA improvement' },
  ];

  for (const f of percentFields) {
    if (!f.raw) continue;
    const n = parseOptionalNumber(f.raw);
    if (typeof n !== 'number' || n < 0) return `${f.label} must be a number between 0 and 100.`;
  }

  return null;
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
  const minDaysRaw = form.minDaysInLevel.trim();
  const minAttRaw = form.minAttendanceRatePercent.trim();
  const minNaRaw = form.minNaImprovementPercent.trim();

  const minDays = minDaysRaw ? parseOptionalInteger(minDaysRaw) : undefined;
  const minAttendance = minAttRaw ? parseOptionalNumber(minAttRaw) : undefined;
  const minNa = minNaRaw ? parseOptionalNumber(minNaRaw) : undefined;

  return {
    minDaysInLevel: minDays,
    minAttendanceRatePercent: typeof minAttendance === 'number' ? clampPercent(minAttendance) : undefined,
    minNaImprovementPercent: typeof minNa === 'number' ? clampPercent(minNa) : undefined,
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
  const [programImageUploading, setProgramImageUploading] = useState(false);
  const [programForm, setProgramForm] = useState<ProgramFormState>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    image: '',
    isActive: true,
  });

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ProgramLevel | null>(null);
  const [levelImageUploading, setLevelImageUploading] = useState(false);
  const [levelForm, setLevelForm] = useState<LevelFormState>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    image: '',
    color: DEFAULT_ACCENT_COLOR,
    minDaysInLevel: '',
    minAttendanceRatePercent: '',
    minNaImprovementPercent: '',
  });

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) || null : null),
    [programs, selectedProgramId]
  );

  const t = dict.programs;

  const { confirm, ConfirmDialog } = useConfirm();

  type StatusFilter = 'all' | 'active' | 'inactive';
  const [programsQuery, setProgramsQuery] = useState('');
  const [programsStatusFilter, setProgramsStatusFilter] = useState<StatusFilter>('all');
  const [levelsQuery, setLevelsQuery] = useState('');

  const cardShell =
    'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const subtleText = 'text-gray-600 dark:text-gray-400';
  const fieldLabelClass = 'text-sm font-semibold text-[#262626] dark:text-white';
  const inputClass =
    'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const textareaClass =
    'min-h-[120px] bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const outlineButtonClass =
    'h-10 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#111114] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1d]';

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
    setProgramForm({ name: '', nameAr: '', description: '', descriptionAr: '', image: '', isActive: true });
    setProgramDialogOpen(true);
  };

  const openEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name || '',
      nameAr: program.nameAr || '',
      description: program.description || '',
      descriptionAr: program.descriptionAr || '',
      image: program.image || '',
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
            image: programForm.image.trim() || undefined,
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
            image: programForm.image.trim() || undefined,
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
    const programName = locale === 'ar' ? program.nameAr : program.name;
    const ok = await confirm({
      title: t?.confirmDeleteProgram || dict.common?.confirmDelete || 'Delete program',
      description: `This will permanently delete the program "${programName || program.id}".\n\nThis action cannot be undone.`,
      confirmText: dict.common?.delete || 'Delete',
      cancelText: dict.common?.cancel || 'Cancel',
      variant: 'destructive',
    });
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
      image: '',
      color: getDefaultProgramLevelColor((levels?.length || 0) + 1),
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
      image: level.image || '',
      color: level.color || getDefaultProgramLevelColor(level.order),
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

    const rulesError = validateRulesForm(levelForm);
    if (rulesError) {
      toast.error(rulesError);
      return;
    }

    const rules = formToRules(levelForm);
    const color = normalizeHexColor(levelForm.color) || DEFAULT_ACCENT_COLOR;

    try {
      if (editingLevel) {
        const result = await updateProgramLevelAction(
          editingLevel.id,
          {
            name,
            nameAr,
            description: levelForm.description.trim() || undefined,
            descriptionAr: levelForm.descriptionAr.trim() || undefined,
            image: levelForm.image.trim() || undefined,
            color,
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
            image: levelForm.image.trim() || undefined,
            color,
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
    const levelName = locale === 'ar' ? level.nameAr : level.name;
    const ok = await confirm({
      title: t?.confirmDeleteLevel || dict.common?.confirmDelete || 'Delete level',
      description: `This will permanently delete the level "${levelName || level.id}".\n\nThis action cannot be undone.`,
      confirmText: dict.common?.delete || 'Delete',
      cancelText: dict.common?.cancel || 'Cancel',
      variant: 'destructive',
    });
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

  const visiblePrograms = useMemo(() => {
    const q = programsQuery.trim().toLowerCase();
    return programs
      .filter((p) => {
        if (programsStatusFilter === 'active' && !p.isActive) return false;
        if (programsStatusFilter === 'inactive' && p.isActive) return false;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.name || ''} ${p.nameAr || ''} ${p.description || ''} ${p.descriptionAr || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [programs, programsQuery, programsStatusFilter]);

  const visibleLevels = useMemo(() => {
    const q = levelsQuery.trim().toLowerCase();
    if (!q) return levels;
    return levels.filter((lvl) => {
      const hay = `${lvl.name || ''} ${lvl.nameAr || ''} ${lvl.description || ''} ${lvl.descriptionAr || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [levels, levelsQuery]);

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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="relative">
            <motion.div
              className="absolute -inset-4 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl"
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Layers className="h-8 w-8 text-purple-600" />
                </motion.div>
                {t?.title || 'Programs'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{t?.description || ''}</p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl shadow-lg">
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-blue-600/8 via-purple-600/8 to-pink-600/8"
                animate={{ opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative p-2">
                <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-black/60 bg-[#0b0b0f] text-white shadow-lg shadow-black/30">
                  <div className="flex-1 min-w-0 h-full">
                    <Button
                      onClick={openCreateProgram}
                      className="h-full w-full justify-center rounded-none border-0 bg-transparent px-4 text-white hover:bg-[#14141a]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="font-semibold">{t?.createProgram || dict.common?.create || 'Create'}</span>
                      <Sparkles className="h-4 w-4 ml-2 text-white/80" />
                    </Button>
                  </div>

                  <div className="w-px bg-white/10" />

                  <div className="shrink-0">
                    <Button asChild className="h-full rounded-none border-0 bg-transparent px-4 text-white hover:bg-[#14141a]">
                      <Link href={`/${locale}/dashboard/programs/members`}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        <span className="font-semibold">{t?.membersTitle || 'Members'}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v === 'programs' || v === 'levels' ? v : 'programs')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="programs">{t?.title || 'Programs'}</TabsTrigger>
          <TabsTrigger value="levels" disabled={!selectedProgramId}>
            {t?.levelsTitle || 'Levels'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <div className={`${cardShell} p-5 sm:p-6`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-[#262626] dark:text-white">{t?.title || 'Programs'}</div>
                  <div className={`text-sm ${subtleText} truncate`}>
                    {'Showing'} {visiblePrograms.length} / {programs.length}
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
                    <div className="shrink-0 min-w-[180px]">
                      <Select value={programsStatusFilter} onValueChange={(v) => setProgramsStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="h-full! w-full rounded-none border-0 bg-transparent px-4 py-0! text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                          <SelectValue placeholder={dict.common?.status || 'Status'} className="leading-none" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                          <SelectItem value="all">{'All'}</SelectItem>
                          <SelectItem value="active">{dict.common?.active || 'Active'}</SelectItem>
                          <SelectItem value="inactive">{dict.common?.inactive || 'Inactive'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-px bg-[#DDDDDD] dark:bg-[#000000]" />

                    <div className="flex-1 min-w-0 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={programsQuery}
                        onChange={(e) => setProgramsQuery(e.target.value)}
                        placeholder={dict.common?.search ? `${dict.common.search}...` : 'Search...'}
                        className="h-full! rounded-none border-0 bg-transparent pl-11 pr-4 py-0! text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visiblePrograms.map((p, idx) => {
              const isSelected = selectedProgramId === p.id;
              const programName = (locale === 'ar' ? p.nameAr : p.name) || p.name || p.nameAr;
              const programDesc = (locale === 'ar' ? p.descriptionAr : p.description) || '';

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Card
                    className={
                      `${cardShell} overflow-hidden ` +
                      (isSelected
                        ? 'border-[#FF5F02]/60 shadow-xl shadow-orange-500/10'
                        : '')
                    }
                  >
                    <div className="relative h-44 bg-gray-100 dark:bg-black/40 overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={programName || 'Program'} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Layers className="h-16 w-16 text-gray-300 dark:text-white/20" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />

                      <div className="absolute top-3 right-3">
                        {p.isActive ? (
                          <div className="px-3 py-1 bg-green-600/90 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {dict.common?.active || 'Active'}
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-gray-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                            {dict.common?.inactive || 'Inactive'}
                          </div>
                        )}
                      </div>

                      {isSelected ? (
                        <div className="absolute bottom-3 left-3">
                          <div className="px-3 py-1 bg-[#FF5F02]/90 backdrop-blur-sm rounded-full text-xs font-black text-white">
                            {t?.selectedProgram || 'Selected'}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div className="min-w-0">
                        <div className="font-black text-lg text-[#262626] dark:text-white truncate">{programName || p.id}</div>
                        {programDesc ? <div className={`text-sm ${subtleText} line-clamp-2`}>{programDesc}</div> : null}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            setSelectedProgramId(p.id);
                            setActiveTab('levels');
                          }}
                          variant="outline"
                          size="sm"
                          className={outlineButtonClass}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          {t?.levelsTitle || 'Levels'}
                        </Button>

                        <Button asChild variant="outline" size="sm" className={outlineButtonClass}>
                          <Link href={`/${locale}/dashboard/programs/members`}>
                            <Layers className="h-4 w-4 mr-1" />
                            {t?.membersTitle || 'Members'}
                          </Link>
                        </Button>

                        <Button
                          onClick={() => openEditProgram(p)}
                          variant="outline"
                          size="sm"
                          className="h-10 border-2 border-blue-500/40 bg-white/80 dark:bg-[#111114] text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1a1a1d]"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {dict.common?.edit || 'Edit'}
                        </Button>

                        <Button
                          onClick={() => void confirmDeleteProgram(p)}
                          variant="outline"
                          size="sm"
                          className="h-10 border-2 border-red-500/40 bg-white/80 dark:bg-[#111114] text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#1a1a1d]"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {dict.common?.delete || 'Delete'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {programs.length === 0 && (
            <div className={`${cardShell} p-10 text-center`}>
              <Layers className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <div className="text-[#262626] dark:text-white font-bold">{t?.noPrograms || 'No programs yet'}</div>
              <div className={`text-sm mt-2 ${subtleText}`}>{t?.description || 'Create your first program to get started.'}</div>
            </div>
          )}

          {programs.length > 0 && visiblePrograms.length === 0 && (
            <div className={`${cardShell} p-10 text-center`}>
              <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <div className="text-[#262626] dark:text-white font-bold">{'No results'}</div>
              <div className={`text-sm mt-2 ${subtleText}`}>{'Try adjusting your filters.'}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="levels">
          {!selectedProgram ? (
            <div className={`${cardShell} p-10 text-center`}>
              <ShieldCheck className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <div className="text-[#262626] dark:text-white font-bold">{t?.selectProgramPrompt || 'Select a program'}</div>
              <div className={`text-sm mt-2 ${subtleText}`}>{'Choose a program from the Programs tab to manage levels.'}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${cardShell} p-5 sm:p-6`}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#262626] dark:text-white">
                        {t?.levelsTitle || 'Levels'}
                      </div>
                      <div className={`text-sm ${subtleText} truncate`}>
                        {(locale === 'ar' ? selectedProgram.nameAr : selectedProgram.name) || selectedProgram.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
                        <div className="shrink-0 min-w-[260px]">
                          <Select
                            value={selectedProgramId || ''}
                            onValueChange={(v) => {
                              setSelectedProgramId(v || null);
                              setLevelsQuery('');
                            }}
                          >
                            <SelectTrigger className="h-full! w-full rounded-none border-0 bg-transparent px-4 py-0! text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                              <SelectValue placeholder={t?.selectedProgram || 'Selected program'} className="leading-none" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {(locale === 'ar' ? p.nameAr : p.name) || p.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-px bg-[#DDDDDD] dark:bg-[#000000]" />

                        <div className="flex-1 min-w-0 relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={levelsQuery}
                            onChange={(e) => setLevelsQuery(e.target.value)}
                            placeholder={'Search levels...'}
                            className="h-full! rounded-none border-0 bg-transparent pl-11 pr-4 py-0! text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-auto">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl shadow-lg">
                        <motion.div
                          className="absolute inset-0 bg-linear-to-r from-blue-600/8 via-purple-600/8 to-pink-600/8"
                          animate={{ opacity: [0.35, 0.6, 0.35] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div className="relative p-2">
                          <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-black/60 bg-[#0b0b0f] text-white shadow-lg shadow-black/30">
                            <Button
                              onClick={openCreateLevel}
                              className="h-full w-full justify-center rounded-none border-0 bg-transparent px-4 text-white hover:bg-[#14141a]"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              <span className="font-semibold">{t?.createLevel || 'Create Level'}</span>
                              <Sparkles className="h-4 w-4 ml-2 text-white/80" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                <div className={`${cardShell} p-10 text-center`}>
                  <ShieldCheck className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
                  <div className="text-[#262626] dark:text-white font-bold">{t?.noLevels || 'No levels yet'}</div>
                  <div className={`text-sm mt-2 ${subtleText}`}>{'Create the first level for this program.'}</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {visibleLevels.map((lvl, idx) => {
                        const levelName = (locale === 'ar' ? lvl.nameAr : lvl.name) || lvl.name || lvl.nameAr;
                        const levelDesc = (locale === 'ar' ? lvl.descriptionAr : lvl.description) || '';
                        const levelColor = lvl.color || getDefaultProgramLevelColor(lvl.order);

                        return (
                          <motion.div
                            key={lvl.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.01, rotateX: 1, rotateY: 1 }}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <Card className={`${cardShell} overflow-hidden`}>
                              <div className="relative h-40 bg-gray-100 dark:bg-black/40 overflow-hidden">
                                {lvl.image ? (
                                  <img src={lvl.image} alt={levelName || 'Level'} className="absolute inset-0 h-full w-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheck className="h-16 w-16 text-gray-300 dark:text-white/20" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />

                                <div className="absolute top-3 left-3">
                                  <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-black text-white">
                                    #{lvl.order}
                                  </div>
                                </div>

                                <div className="absolute top-3 right-3">
                                  <div
                                    className="h-8 w-8 rounded-full border-2 border-white/30 shadow-lg"
                                    style={{ backgroundColor: levelColor }}
                                    title={levelColor}
                                  />
                                </div>
                              </div>

                              <CardContent className="p-4 space-y-3">
                                <div className="min-w-0">
                                  <div className="font-black text-lg text-[#262626] dark:text-white truncate">{levelName || lvl.id}</div>
                                  {levelDesc ? <div className={`text-sm ${subtleText} line-clamp-2`}>{levelDesc}</div> : null}
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <div className={`text-xs ${subtleText}`}>{t?.fields?.levelColor || 'Level color'}</div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-mono ${subtleText}`}>{levelColor}</span>
                                    <div
                                      className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20"
                                      style={{ backgroundColor: levelColor }}
                                      aria-hidden
                                    />
                                  </div>
                                </div>

                                <div className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t?.rulesTitle || 'Pass Rules'}</div>
                                  {rulesBadges(lvl.passRules)}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={outlineButtonClass}
                                    onClick={() => void moveLevel(lvl, 'up')}
                                    disabled={lvl.order <= 1}
                                  >
                                    <ArrowUp className="h-4 w-4 mr-1" />
                                    {'Up'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={outlineButtonClass}
                                    onClick={() => void moveLevel(lvl, 'down')}
                                    disabled={lvl.order >= (levels.at(-1)?.order || lvl.order)}
                                  >
                                    <ArrowDown className="h-4 w-4 mr-1" />
                                    {'Down'}
                                  </Button>

                                  <Button
                                    onClick={() => openEditLevel(lvl)}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 border-2 border-blue-500/40 bg-white/80 dark:bg-[#111114] text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1a1a1d]"
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    {dict.common?.edit || 'Edit'}
                                  </Button>
                                  <Button
                                    onClick={() => void confirmDeleteLevel(lvl)}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 border-2 border-red-500/40 bg-white/80 dark:bg-[#111114] text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#1a1a1d]"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {dict.common?.delete || 'Delete'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {levels.length > 0 && visibleLevels.length === 0 && (
                    <div className={`${cardShell} p-10 text-center`}>
                      <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
                      <div className="text-[#262626] dark:text-white font-bold">{'No results'}</div>
                      <div className={`text-sm mt-2 ${subtleText}`}>{'Try adjusting your search.'}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent className="sm:max-w-[860px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {editingProgram ? (t?.editProgram || 'Edit Program') : (t?.createProgram || 'Create Program')}
            </DialogTitle>
            {t?.description ? <DialogDescription className={subtleText}>{t.description}</DialogDescription> : null}
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.image || 'Program image'}</Label>
                <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#111114] p-4">
                  <ImageUpload
                    currentImage={programForm.image || undefined}
                    onUpload={async (file, croppedImageUrl) => {
                      setProgramImageUploading(true);
                      const url = await uploadCroppedImage(file, croppedImageUrl);
                      if (url) {
                        setProgramForm((p) => ({ ...p, image: url }));
                        toast.success(dict.common?.success || 'Uploaded');
                      } else {
                        toast.error(dict.common?.error || 'Failed to upload');
                      }
                      setProgramImageUploading(false);
                    }}
                    onError={(message) => toast.error(message)}
                    shape="square"
                    size="md"
                    aspectRatio={16 / 9}
                    hideHint
                    variant="minimal"
                  />
                  <div className={`mt-3 text-xs ${subtleText}`}>{t?.imageHint || 'Upload a cover image (max 5MB).'}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.nameEn || 'Name (English)'}</Label>
                <Input
                  dir="ltr"
                  value={programForm.name}
                  onChange={(e) => setProgramForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  placeholder={t?.fields?.nameEn || 'Name (English)'}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.nameAr || 'Name (Arabic)'}</Label>
                <Input
                  dir="rtl"
                  value={programForm.nameAr}
                  onChange={(e) => setProgramForm((p) => ({ ...p, nameAr: e.target.value }))}
                  className={inputClass}
                  placeholder={t?.fields?.nameAr || 'Name (Arabic)'}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.descriptionEn || 'Description (English)'}</Label>
                <Textarea
                  dir="ltr"
                  value={programForm.description}
                  onChange={(e) => setProgramForm((p) => ({ ...p, description: e.target.value }))}
                  className={textareaClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.descriptionAr || 'Description (Arabic)'}</Label>
                <Textarea
                  dir="rtl"
                  value={programForm.descriptionAr}
                  onChange={(e) => setProgramForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          {editingProgram && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
              <div className="min-w-0">
                <Label className="font-semibold text-[#262626] dark:text-white">{dict.common?.status || 'Status'}</Label>
                <div className={`text-xs mt-1 ${subtleText}`}>{dict.common?.active || 'Active'} / {dict.common?.inactive || 'Inactive'}</div>
              </div>
              <Switch
                checked={programForm.isActive}
                onCheckedChange={(v) => setProgramForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)} className="h-12 border-2">
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={() => void saveProgram()}
              disabled={programImageUploading}
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
            >
              {dict.common?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-[980px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {editingLevel ? (t?.editLevel || 'Edit Level') : (t?.createLevel || 'Create Level')}
            </DialogTitle>
            <DialogDescription className={subtleText}>{t?.rulesTitle || 'Pass Rules'}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.levelImage || 'Level image'}</Label>
                <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#111114] p-4">
                  <ImageUpload
                    currentImage={levelForm.image || undefined}
                    onUpload={async (file, croppedImageUrl) => {
                      setLevelImageUploading(true);
                      const url = await uploadCroppedImage(file, croppedImageUrl);
                      if (url) {
                        setLevelForm((p) => ({ ...p, image: url }));
                        toast.success(dict.common?.success || 'Uploaded');
                      } else {
                        toast.error(dict.common?.error || 'Failed to upload');
                      }
                      setLevelImageUploading(false);
                    }}
                    onError={(message) => toast.error(message)}
                    shape="square"
                    size="md"
                    aspectRatio={1}
                    hideHint
                    variant="minimal"
                  />
                  <div className={`mt-3 text-xs ${subtleText}`}>{t?.levelImageHint || 'Upload a level image (max 5MB).'}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.levelNameEn || 'Level name (English)'}</Label>
                <Input
                  dir="ltr"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.levelNameAr || 'Level name (Arabic)'}</Label>
                <Input
                  dir="rtl"
                  value={levelForm.nameAr}
                  onChange={(e) => setLevelForm((p) => ({ ...p, nameAr: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className={fieldLabelClass}>{t?.fields?.levelColor || 'Level color'}</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    aria-label={t?.fields?.levelColor || 'Level color'}
                    type="color"
                    value={normalizeHexColor(levelForm.color) || DEFAULT_ACCENT_COLOR}
                    onChange={(e) => setLevelForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-12 w-16 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#111114] p-1"
                  />
                  <Input
                    dir="ltr"
                    value={levelForm.color}
                    onChange={(e) => setLevelForm((p) => ({ ...p, color: e.target.value }))}
                    placeholder="#FF5F02"
                    className={inputClass}
                  />
                  <div className={`text-xs ${subtleText}`}>{t?.levelColorHint || 'Used as the UI accent for this level.'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.descriptionEn || 'Description (English)'}</Label>
                <Textarea
                  dir="ltr"
                  value={levelForm.description}
                  onChange={(e) => setLevelForm((p) => ({ ...p, description: e.target.value }))}
                  className={textareaClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.fields?.descriptionAr || 'Description (Arabic)'}</Label>
                <Textarea
                  dir="rtl"
                  value={levelForm.descriptionAr}
                  onChange={(e) => setLevelForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          <Card className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
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
                <Label className={fieldLabelClass}>{t?.minDaysInLevel || 'Minimum days in level'}</Label>
                <Input
                  inputMode="numeric"
                  value={levelForm.minDaysInLevel}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minDaysInLevel: e.target.value }))}
                  placeholder="e.g. 90"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.minAttendanceRate || 'Minimum attendance rate (%)'}</Label>
                <Input
                  inputMode="numeric"
                  value={levelForm.minAttendanceRatePercent}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minAttendanceRatePercent: e.target.value }))}
                  placeholder="e.g. 70"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>{t?.minNaImprovementPercent || 'Minimum NA improvement (%)'}</Label>
                <Input
                  inputMode="numeric"
                  value={levelForm.minNaImprovementPercent}
                  onChange={(e) => setLevelForm((p) => ({ ...p, minNaImprovementPercent: e.target.value }))}
                  placeholder="e.g. 10"
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLevelDialogOpen(false)} className="h-12 border-2">
              {dict.common?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={() => void saveLevel()}
              disabled={levelImageUploading}
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
            >
              {dict.common?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </motion.div>
  );
}
