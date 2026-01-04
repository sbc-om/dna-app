'use client';

import type { User } from '@/lib/db/repositories/userRepository';
import type { AuthUser } from '@/lib/auth/auth';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Award,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Cake,
  CheckCircle2,
  Edit,
  Flag,
  IdCard,
  Plus,
  School,
  Save,
  Star,
  Trash2,
  Trophy,
  UserCircle,
} from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { StudentMedalsDisplay } from '@/components/StudentMedalsDisplay';
import { updateUserProfilePictureAction } from '@/lib/actions/userActions';
import { getEnrollmentsByStudentIdAction, updateEnrollmentCourseAction, createEnrollmentAction, deleteEnrollmentAction } from '@/lib/actions/enrollmentActions';
import { getActiveCoursesAction } from '@/lib/actions/courseActions';
import {
  getPlayerProgramEnrollmentsAction,
  addCoachNoteToProgramPlayerAction,
  getProgramLevelsForProgramAction,
  getProgramLevelsForPlayerProgramAction,
  setPlayerProgramLevelAction,
} from '@/lib/actions/programEnrollmentActions';
import { getProgramAttendanceSummaryForUserProgramsAction } from '@/lib/actions/programAttendanceActions';
import { useEffect, useMemo, useState } from 'react';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { PlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import type { Program } from '@/lib/db/repositories/programRepository';
import type { ProgramLevel } from '@/lib/db/repositories/programLevelRepository';
import type { ProgramCoachNote, ProgramLevelHistoryEntry } from '@/lib/db/repositories/programEnrollmentRepository';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import {
  ensurePlayerProfileAction,
  grantPlayerBadgeAction,
  syncPlayerProfileAfterAssessmentAction,
} from '@/lib/actions/playerProfileActions';
import {
  createDnaAssessmentAction,
  deleteDnaAssessmentAction,
  getDnaAssessmentsForPlayerAction,
  type DnaAssessmentSession,
} from '@/lib/actions/dnaAssessmentActions';
import { BADGES } from '@/lib/player/badges';
import { calculateCategoryScores } from '@/lib/player/dnaScoring';
import { useRouter } from 'next/navigation';
import { DEFAULT_ACCENT_COLOR } from '@/lib/theme/accentColors';
import { DnaCircularGauge } from '@/components/DnaCircularGauge';

interface KidProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User;
  currentUser: AuthUser;
  academyId: string;
}

export function KidProfileClient({
  dictionary,
  locale,
  kid,
  currentUser,
  academyId,
}: KidProfileClientProps) {
  const NO_LEVEL_VALUE = '__none__';
  type EnrichedEnrollment = Enrollment & { course?: Course | null };
  type AssessmentFieldKey = 'speed' | 'agility' | 'balance' | 'power' | 'reaction' | 'coordination' | 'flexibility';
  type AssessmentFormState = { sessionDate: string; notes: string } & Record<AssessmentFieldKey, string>;
  type PlayerProgramEnrollment = {
    id: string;
    academyId: string;
    programId: string;
    userId: string;
    status: string;
    joinedAt: string;
    currentLevelId?: string;
    pointsTotal: number;
    coachNotes: ProgramCoachNote[];
    levelHistory?: ProgramLevelHistoryEntry[];
    program: Program | null;
    currentLevel: ProgramLevel | null;
  };

  const [currentKid, setCurrentKid] = useState<User>(kid);
  const [enrollments, setEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [savingCourse, setSavingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [assessments, setAssessments] = useState<DnaAssessmentSession[]>([]);

  const [programEnrollments, setProgramEnrollments] = useState<PlayerProgramEnrollment[]>([]);
  const [loadingProgramEnrollments, setLoadingProgramEnrollments] = useState(false);
  const [programEnrollmentsError, setProgramEnrollmentsError] = useState<string | null>(null);
  const [programLevelsByProgramId, setProgramLevelsByProgramId] = useState<Record<string, ProgramLevel[]>>({});
  const [programAttendanceByProgramId, setProgramAttendanceByProgramId] = useState<
    Record<string, { attended: number; marked: number }>
  >({});

  const totalProgramSessionsAttended = useMemo(() => {
    return Object.values(programAttendanceByProgramId).reduce((sum, v) => sum + (Number.isFinite(v?.attended) ? v.attended : 0), 0);
  }, [programAttendanceByProgramId]);

  const totalProgramPoints = useMemo(() => {
    return programEnrollments.reduce((sum, e) => sum + (Number.isFinite(e.pointsTotal) ? e.pointsTotal : 0), 0);
  }, [programEnrollments]);

  const accentColor = useMemo(() => {
    const fromLevel = programEnrollments.find((e) => e.currentLevel?.color)?.currentLevel?.color;
    return fromLevel ?? DEFAULT_ACCENT_COLOR;
  }, [programEnrollments]);

  useEffect(() => {
    document.documentElement.style.setProperty('--dna-accent', accentColor || DEFAULT_ACCENT_COLOR);
    return () => {
      document.documentElement.style.removeProperty('--dna-accent');
    };
  }, [accentColor]);

  const [programNoteDialogOpen, setProgramNoteDialogOpen] = useState(false);
  const [programNoteTarget, setProgramNoteTarget] = useState<PlayerProgramEnrollment | null>(null);
  const [programNotePointsDelta, setProgramNotePointsDelta] = useState<string>('');
  const [programNoteComment, setProgramNoteComment] = useState<string>('');
  const [programNoteSubmitting, setProgramNoteSubmitting] = useState(false);

  const [programLevelDialogOpen, setProgramLevelDialogOpen] = useState(false);
  const [programLevelTargetProgramId, setProgramLevelTargetProgramId] = useState<string>('');
  const [programLevelOptions, setProgramLevelOptions] = useState<ProgramLevel[]>([]);
  const [loadingProgramLevelOptions, setLoadingProgramLevelOptions] = useState(false);
  const [programLevelSelectedId, setProgramLevelSelectedId] = useState<string>('');
  const [programLevelPointsDelta, setProgramLevelPointsDelta] = useState<string>('');
  const [programLevelComment, setProgramLevelComment] = useState<string>('');
  const [programLevelSubmitting, setProgramLevelSubmitting] = useState(false);

  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<AssessmentFormState>({
    sessionDate: new Date().toISOString().split('T')[0],
    // New assessment UI uses 1–10 points for each category.
    // Keep strings for controlled inputs.
    speed: '5',
    agility: '5',
    balance: '5',
    power: '5',
    reaction: '5',
    coordination: '5',
    flexibility: '5',
    notes: '',
  });

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [badgeNotes, setBadgeNotes] = useState('');
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);

  const router = useRouter();

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'coach' || currentUser?.role === 'manager';
  const canAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const actionLabel = {
    editProfile: dictionary.playerProfile?.actions?.editProfile ?? (dictionary.common.edit || 'Edit'),
    newAssessment: dictionary.playerProfile?.actions?.newAssessment ?? 'New assessment',
    grantBadge: dictionary.playerProfile?.actions?.grantBadge ?? 'Grant badge',
    adjustProgramLevel: dictionary.playerProfile?.actions?.adjustProgramLevel ?? 'Adjust program level',
    achievements: dictionary.playerProfile?.tabs?.achievements ?? 'Achievements',
    viewCard: dictionary.playerProfile?.actions?.viewCard ?? 'View player card',
  };

  const scoreLabel = dictionary.playerProfile?.labels?.score ?? 'Score';

  const loadProgramLevelOptionsFor = async (programId: string) => {
    setLoadingProgramLevelOptions(true);
    try {
      const res = await getProgramLevelsForProgramAction({
        locale,
        academyId,
        programId,
      });

      if (!res.success || !res.levels) {
        setProgramLevelOptions([]);
        alert(res.error || dictionary.common.error);
        return;
      }

      setProgramLevelOptions(res.levels);
    } catch (error) {
      console.error('Load program levels error:', error);
      setProgramLevelOptions([]);
      alert(dictionary.common.error);
    } finally {
      setLoadingProgramLevelOptions(false);
    }
  };

  const openProgramLevelDialog = async (enrollment?: PlayerProgramEnrollment) => {
    if (!canAdmin) return;
    const programId = enrollment?.programId ?? programEnrollments[0]?.programId ?? '';
    if (!programId) {
      alert(dictionary.programs?.noPlayerPrograms ?? dictionary.common.error);
      return;
    }

    setProgramLevelDialogOpen(true);
    setProgramLevelTargetProgramId(programId);
    setProgramLevelSelectedId(enrollment?.currentLevelId ?? NO_LEVEL_VALUE);
    setProgramLevelPointsDelta('');
    setProgramLevelComment('');

    await loadProgramLevelOptionsFor(programId);
  };

  const handleProgramLevelTargetProgramChange = async (programId: string) => {
    setProgramLevelTargetProgramId(programId);
    const currentEnrollment = programEnrollments.find((e) => e.programId === programId);
    setProgramLevelSelectedId(currentEnrollment?.currentLevelId ?? NO_LEVEL_VALUE);
    setProgramLevelPointsDelta('');
    setProgramLevelComment('');
    await loadProgramLevelOptionsFor(programId);
  };

  const shiftProgramLevel = (direction: 'prev' | 'next') => {
    const levels = [...programLevelOptions].sort((a, b) => a.order - b.order);
    if (levels.length === 0) return;

    const currentIdx = levels.findIndex((l) => l.id === programLevelSelectedId);
    const idx = currentIdx >= 0 ? currentIdx : -1;
    const nextIdx = direction === 'prev' ? Math.max(0, idx - 1) : Math.min(levels.length - 1, idx + 1);
    setProgramLevelSelectedId(levels[nextIdx]?.id ?? '');
  };

  const handleSaveProgramLevel = async () => {
    if (!canAdmin) return;
    if (!programLevelTargetProgramId) return;

    const pointsRaw = programLevelPointsDelta.trim();
    const pointsDelta = pointsRaw.length ? Number(pointsRaw) : undefined;
    if (pointsDelta !== undefined && (!Number.isFinite(pointsDelta) || !Number.isInteger(pointsDelta))) {
      alert(dictionary.programs?.invalidPointsDelta ?? dictionary.common.error);
      return;
    }

    setProgramLevelSubmitting(true);
    try {
      const res = await setPlayerProgramLevelAction({
        locale,
        academyId,
        programId: programLevelTargetProgramId,
        userId: kid.id,
        nextLevelId:
          programLevelSelectedId && programLevelSelectedId !== NO_LEVEL_VALUE
            ? programLevelSelectedId
            : null,
        pointsDelta,
        comment: programLevelComment.trim() || undefined,
      });

      if (!res.success) {
        alert(res.error || dictionary.common.error);
        return;
      }

      await loadProgramEnrollments();
      setProgramLevelDialogOpen(false);
      alert(dictionary.common.success);
    } catch (error) {
      console.error('Set program level error:', error);
      alert(dictionary.common.error);
    } finally {
      setProgramLevelSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    try {
      const result = await updateUserProfilePictureAction(currentKid.id, croppedImageUrl);
      if (result.success && result.user) {
        setCurrentKid(result.user);
      } else {
        alert(result.error || dictionary.common.error);
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      alert(dictionary.common.error);
    }
  };

  useEffect(() => {
    loadEnrollmentAndCourses();
  }, [kid.id]);

  useEffect(() => {
    void loadPlayerProfile();
  }, [kid.id, academyId]);

  useEffect(() => {
    void loadProgramEnrollments();
  }, [kid.id, academyId]);

  async function loadEnrollmentAndCourses() {
    // Load kid's enrollments (can have multiple)
    const enrollmentResult = await getEnrollmentsByStudentIdAction(kid.id);
    if (enrollmentResult.success && enrollmentResult.enrollments) {
      setEnrollments(enrollmentResult.enrollments as EnrichedEnrollment[]);
    }

    // Load available courses (for admin to add new course)
    if (canAdmin) {
      const coursesResult = await getActiveCoursesAction();
      if (coursesResult.success && coursesResult.courses) {
        setAvailableCourses(coursesResult.courses);
      }
    }
  }

  async function loadPlayerProfile() {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const ensured = await ensurePlayerProfileAction({
        locale,
        academyId,
        userId: kid.id,
      });

      if (!ensured.success) {
        setProfileError(ensured.error || dictionary.common.error);
        setProfile(null);
      } else {
        setProfile(ensured.profile);
      }

      const assRes = await getDnaAssessmentsForPlayerAction({
        locale,
        academyId,
        playerId: kid.id,
      });
      if (assRes.success && assRes.sessions) {
        setAssessments(assRes.sessions);
      } else {
        setAssessments([]);
      }
    } catch (error) {
      console.error('Load player profile error:', error);
      setProfileError(dictionary.common.error);
      setProfile(null);
      setAssessments([]);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadProgramEnrollments() {
    setLoadingProgramEnrollments(true);
    setProgramEnrollmentsError(null);

    try {
      const res = await getPlayerProgramEnrollmentsAction({
        locale,
        academyId,
        userId: kid.id,
      });

      if (!res.success || !res.enrollments) {
        setProgramEnrollments([]);
        setProgramLevelsByProgramId({});
        setProgramEnrollmentsError(res.error || dictionary.common.error);
        return;
      }

      const enrollments = res.enrollments as PlayerProgramEnrollment[];
      setProgramEnrollments(enrollments);

      // Load levels for each program so we can render a full journey track.
      const uniqueProgramIds = Array.from(new Set(enrollments.map((e) => e.programId).filter(Boolean)));
      const pairs = await Promise.all(
        uniqueProgramIds.map(async (programId) => {
          const levelsRes = await getProgramLevelsForPlayerProgramAction({
            locale,
            academyId,
            programId,
            userId: kid.id,
          });
          return [programId, levelsRes.success && levelsRes.levels ? levelsRes.levels : []] as const;
        })
      );

      const nextMap: Record<string, ProgramLevel[]> = {};
      for (const [programId, levels] of pairs) {
        nextMap[programId] = levels;
      }
      setProgramLevelsByProgramId(nextMap);

      // Load per-program session counts for this player.
      if (uniqueProgramIds.length > 0) {
        const attRes = await getProgramAttendanceSummaryForUserProgramsAction({
          locale,
          academyId,
          userId: kid.id,
          programIds: uniqueProgramIds,
        });
        if (attRes.success) {
          setProgramAttendanceByProgramId(attRes.byProgramId);
        } else {
          setProgramAttendanceByProgramId({});
        }
      } else {
        setProgramAttendanceByProgramId({});
      }
    } catch (error) {
      console.error('Load program enrollments error:', error);
      setProgramEnrollments([]);
      setProgramLevelsByProgramId({});
      setProgramAttendanceByProgramId({});
      setProgramEnrollmentsError(dictionary.common.error);
    } finally {
      setLoadingProgramEnrollments(false);
    }
  }

  const getProgramLevelLabel = (level: ProgramLevel) => (locale === 'ar' ? level.nameAr : level.name);

  const levelJourneyLabels = {
    title: dictionary.playerProfile?.journey?.programTitle ?? (dictionary.programs?.journeyTitle ?? 'Program journey'),
    progress: dictionary.playerProfile?.journey?.labels?.progress ?? 'Progress',
    statusCompleted: dictionary.playerProfile?.journey?.status?.completed ?? 'Completed',
    statusInProgress: dictionary.playerProfile?.journey?.status?.inProgress ?? 'In progress',
    statusLocked: dictionary.playerProfile?.journey?.status?.locked ?? 'Locked',
    started: dictionary.playerProfile?.journey?.labels?.started ?? 'Started',
    ended: dictionary.playerProfile?.journey?.labels?.ended ?? 'Finished',
    noLevels: dictionary.programs?.noLevelsDefined ?? 'No levels defined for this program yet.',
    noHistory: dictionary.programs?.noLevelHistory ?? 'No level history yet.',
  };

  const programLevelProgressPct = (params: { enrollment: PlayerProgramEnrollment; level: ProgramLevel; isCurrent: boolean }) => {
    if (!params.isCurrent) return 100;

    const rules = params.level.passRules;
    const requiredSessions = typeof rules?.minSessionsAttended === 'number' ? rules.minSessionsAttended : undefined;
    const requiredPoints =
      typeof (rules as any)?.minPointsEarned === 'number'
        ? (rules as any).minPointsEarned
        : (typeof (rules as any)?.minXpEarned === 'number' ? (rules as any).minXpEarned : undefined);

    const sessionsAttended = programAttendanceByProgramId[params.enrollment.programId]?.attended ?? 0;
    const points = Number.isFinite(params.enrollment.pointsTotal) ? params.enrollment.pointsTotal : 0;

    const parts: number[] = [];
    if (typeof requiredSessions === 'number' && requiredSessions > 0) {
      parts.push(Math.max(0, Math.min(1, sessionsAttended / requiredSessions)));
    }
    if (typeof requiredPoints === 'number' && requiredPoints > 0) {
      parts.push(Math.max(0, Math.min(1, points / requiredPoints)));
    }

    if (parts.length === 0) return 100;
    return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  };

  const openProgramNoteDialog = (enrollment: PlayerProgramEnrollment) => {
    setProgramNoteTarget(enrollment);
    setProgramNotePointsDelta('');
    setProgramNoteComment('');
    setProgramNoteDialogOpen(true);
  };

  const submitProgramNote = async () => {
    if (!programNoteTarget) return;

    const rawDelta = programNotePointsDelta.trim();
    const pointsDelta: number | undefined = rawDelta ? Number(rawDelta) : undefined;
    if (rawDelta) {
      if (typeof pointsDelta !== 'number' || !Number.isFinite(pointsDelta) || Math.abs(pointsDelta) > 100000) {
        alert(dictionary.common.error);
        return;
      }
    }

    const comment = programNoteComment.trim() ? programNoteComment.trim() : undefined;
    if (!comment && typeof pointsDelta !== 'number') {
      alert(dictionary.common.error);
      return;
    }

    setProgramNoteSubmitting(true);
    try {
      const res = await addCoachNoteToProgramPlayerAction({
        locale,
        academyId,
        programId: programNoteTarget.programId,
        userId: kid.id,
        pointsDelta: typeof pointsDelta === 'number' ? pointsDelta : undefined,
        comment,
      });

      if (!res.success) {
        alert(res.error || dictionary.common.error);
        return;
      }

      setProgramNoteDialogOpen(false);
      setProgramNoteTarget(null);
      await loadProgramEnrollments();
    } catch (error) {
      console.error('Submit program note error:', error);
      alert(dictionary.common.error);
    } finally {
      setProgramNoteSubmitting(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!selectedCourseId) return;
    
    setSavingCourse(true);
    
    try {
      if (editingEnrollmentId) {
        // Update existing enrollment
        const result = await updateEnrollmentCourseAction(editingEnrollmentId, selectedCourseId);
        if (result.success) {
          await loadEnrollmentAndCourses();
          setEditingCourse(false);
          setEditingEnrollmentId(null);
          setSelectedCourseId('');
        } else {
          alert(result.error || dictionary.common.error);
        }
      } else {
        // Create new enrollment
        const result = await createEnrollmentAction({
          studentId: kid.id,
          courseId: selectedCourseId,
          parentId: kid.parentId || '',
        });
        if (result.success) {
          await loadEnrollmentAndCourses();
          setEditingCourse(false);
          setSelectedCourseId('');
        } else {
          alert(result.error || dictionary.common.error);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert(dictionary.common.error);
    }
    
    setSavingCourse(false);
  };

  const handleEditEnrollment = (enrollment: EnrichedEnrollment) => {
    setEditingEnrollmentId(enrollment.id);
    setSelectedCourseId(enrollment.courseId);
    setEditingCourse(true);
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm(dictionary.common.confirmDelete)) {
      return;
    }

    setDeletingEnrollmentId(enrollmentId);
    const result = await deleteEnrollmentAction(enrollmentId);
    
    if (result.success) {
      await loadEnrollmentAndCourses();
    } else {
      alert(result.error || dictionary.common.error);
    }
    setDeletingEnrollmentId(null);
  };

  const handleCancelEdit = () => {
    setEditingCourse(false);
    setEditingEnrollmentId(null);
    setSelectedCourseId('');
  };

  const latestAssessment = useMemo(() => (assessments.length > 0 ? assessments[0] : null), [assessments]);

  const insights = useMemo(() => {
    if (!latestAssessment) return null;
    const scores: Record<string, number> = calculateCategoryScores(latestAssessment.tests);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const strengths = sorted.slice(0, 3).map(([k]) => k);
    const development = sorted.slice(-2).map(([k]) => k);
    return { scores, strengths, development };
  }, [latestAssessment]);

  const grantedBadgeIds = useMemo(() => {
    const list = profile?.badges || [];
    return new Set(list.map((b) => b.badgeId));
  }, [profile]);

  const openGrantBadgeDialog = () => {
    setSelectedBadgeId('');
    setBadgeNotes('');
    setBadgeDialogOpen(true);
  };

  const t = (path: string): string => {
    const parts = path.split('.');
    let cur: unknown = dictionary;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return path;
      cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === 'string' ? cur : path;
  };

  const handleGrantBadge = async () => {
    if (!selectedBadgeId) return;
    setBadgeSubmitting(true);
    try {
      const res = await grantPlayerBadgeAction({
        locale,
        academyId,
        userId: kid.id,
        badgeId: selectedBadgeId,
        notes: badgeNotes || undefined,
      });
      if (!res.success) {
        alert(res.error || dictionary.common.error);
      } else {
        setBadgeDialogOpen(false);
        await loadPlayerProfile();
      }
    } catch (error) {
      console.error('Grant badge error:', error);
      alert(dictionary.common.error);
    } finally {
      setBadgeSubmitting(false);
    }
  };

  const handleCreateAssessment = async () => {
    setAssessmentSubmitting(true);
    try {
      const tests = {
        speed: Number(assessmentForm.speed),
        agility: Number(assessmentForm.agility),
        balance: Number(assessmentForm.balance),
        power: Number(assessmentForm.power),
        reaction: Number(assessmentForm.reaction),
        coordination: Number(assessmentForm.coordination),
        flexibility: Number(assessmentForm.flexibility),
      };

      const values = Object.values(tests);
      const invalid = values.some((v) => !Number.isFinite(v) || v < 1 || v > 10);
      if (invalid) {
        alert(dictionary.common.error);
        return;
      }

      const created = await createDnaAssessmentAction({
        locale,
        academyId,
        playerId: kid.id,
        sessionDate: assessmentForm.sessionDate,
        enteredBy: currentUser.id,
        tests,
        notes: assessmentForm.notes || undefined,
      });

      if (!created.success) {
        alert(created.error || dictionary.common.error);
        return;
      }

      // Sync profile points/status
      await ensurePlayerProfileAction({ locale, academyId, userId: kid.id });
      await syncPlayerProfileAfterAssessmentAction({
        locale,
        academyId,
        userId: kid.id,
      });

      setAssessmentDialogOpen(false);
      setAssessmentForm({
        sessionDate: new Date().toISOString().split('T')[0],
        speed: '5',
        agility: '5',
        balance: '5',
        power: '5',
        reaction: '5',
        coordination: '5',
        flexibility: '5',
        notes: '',
      });

      await loadPlayerProfile();
    } catch (error) {
      console.error('Create assessment error:', error);
      alert(dictionary.common.error);
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!canAdmin) return;
    const confirmed = confirm(dictionary.common.confirmDelete);
    if (!confirmed) return;
    const res = await deleteDnaAssessmentAction({
      locale,
      academyId,
      playerId: kid.id,
      assessmentId,
    });
    if (!res.success) {
      alert(res.error || dictionary.common.error);
      return;
    }
    await loadPlayerProfile();
  };

  const categoryLabel = (key: string) => {
    const labels: Record<string, string> = {
      speed: dictionary.playerProfile?.categories?.speed ?? 'Speed',
      agility: dictionary.playerProfile?.categories?.agility ?? 'Agility',
      balance: dictionary.playerProfile?.categories?.balance ?? 'Balance',
      power: dictionary.playerProfile?.categories?.power ?? 'Power',
      reaction: dictionary.playerProfile?.categories?.reaction ?? 'Reaction',
      coordination: dictionary.playerProfile?.categories?.coordination ?? 'Coordination',
      flexibility: dictionary.playerProfile?.categories?.flexibility ?? 'Flexibility',
    };
    return labels[key] || key;
  };

  const assessmentStatusLabel = (status?: string) => {
    const labels = dictionary.playerProfile?.assessmentStatuses;
    switch (status) {
      case 'new':
        return labels?.new ?? 'New';
      case 'first_assessment_completed':
        return labels?.firstAssessmentCompleted ?? 'First assessment completed';
      case 'reassessment':
        return labels?.reassessment ?? 'Reassessment';
      case 'stage_evaluation':
        return labels?.stageEvaluation ?? 'Progress evaluation';
      case 'due_for_reassessment':
        return labels?.dueForReassessment ?? 'Due for reassessment';
      default:
        return status || (labels?.new ?? 'New');
    }
  };

  const PanelCard = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }) => (
    <Card className="overflow-hidden rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-lg dark:border-[#000000] dark:bg-[#262626]">
      <CardHeader className="py-4 bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
        <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2 text-base">
          {Icon ? <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : null}
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 pb-6">{children}</CardContent>
    </Card>
  );

  const InfoChip = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }) => (
    <div className="flex items-center gap-2 rounded-xl border-2 border-[#DDDDDD] bg-white px-3 py-2 dark:border-[#000000] dark:bg-[#1a1a1a]">
      <Icon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
      <div className="min-w-0">
        <div className="text-[11px] leading-4 text-gray-600 dark:text-gray-400 truncate">{label}</div>
        <div className="text-sm font-semibold text-[#262626] dark:text-white truncate">{value}</div>
      </div>
    </div>
  );

  const StatTile = ({
    icon: Icon,
    title,
    value,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: React.ReactNode;
  }) => (
    <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-5 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{title}</div>
          <div className="mt-1 text-2xl font-bold text-[#262626] dark:text-white truncate">{value}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl border-2 border-[#DDDDDD] bg-gray-50 flex items-center justify-center shrink-0 dark:border-[#000000] dark:bg-[#0a0a0a]">
          <Icon className="h-5 w-5 text-[#262626] dark:text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
      // Add bottom padding so the page content never sits under the global mobile bottom nav.
      className="space-y-6 pb-28 lg:pb-0"
    >
      {/* Header */}
      <Card className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-lg dark:border-[#000000] dark:bg-[#262626]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-28 -left-28 h-80 w-80 rounded-full blur-3xl opacity-60"
            style={{ backgroundColor: `${accentColor}33` }}
          />
          <div
            className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full blur-3xl opacity-40"
            style={{ backgroundColor: `${accentColor}26` }}
          />
        </div>

        <CardContent className="relative p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, type: 'spring' }}
              whileHover={{ rotateX: 2, rotateY: 2, scale: 1.01 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="flex-1 min-w-0"
            >
              <div
                className="relative overflow-hidden rounded-3xl border-2 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)]"
                style={{ borderColor: accentColor }}
              >
                <div className="relative h-44 sm:h-52" style={{ backgroundColor: accentColor }}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
                </div>

                <div className="absolute inset-x-0 top-7 flex justify-center">
                  <motion.div whileHover={{ scale: 1.03 }} className="relative">
                    {canAdmin ? (
                      <ImageUpload
                        onUpload={handleImageUpload}
                        currentImage={currentKid.profilePicture}
                        aspectRatio={1}
                        maxSizeMB={2}
                        shape="square"
                        size="md"
                        hideHint
                        variant="minimal"
                      />
                    ) : currentKid.profilePicture ? (
                      <img
                        src={currentKid.profilePicture}
                        alt={currentKid.fullName || currentKid.username}
                        className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover border border-black/25 shadow-2xl"
                      />
                    ) : (
                      <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-black/25 border border-black/25 flex items-center justify-center shadow-2xl">
                        <UserCircle className="h-14 w-14 text-white/90" />
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="relative bg-gray-50 dark:bg-[#0b0b0f] backdrop-blur-xl border-t-2 border-[#DDDDDD] dark:border-[#000000] p-4 sm:p-5">
                  <div className="relative flex flex-col items-center text-center gap-2">
                    <div
                      className="absolute right-0 top-0 h-10 w-10 rounded-2xl border-2 border-[#DDDDDD] shadow-lg dark:border-[#000000]"
                      style={{ backgroundColor: accentColor }}
                      aria-hidden
                    />
                    <div className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white leading-tight px-10">
                      {currentKid.fullName || currentKid.username}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {dictionary.playerProfile?.labels?.points ?? 'Total points'}
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-[#262626] dark:text-white">{totalProgramPoints}</div>
                    </div>

                    <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {dictionary.playerProfile?.labels?.sessions ?? dictionary.programs?.sessionsAttendedLabel ?? 'Sessions attended'}
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-[#262626] dark:text-white">{totalProgramSessionsAttended}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentKid.birthDate ? (
                  <InfoChip
                    icon={Cake}
                    label={dictionary.playerProfile?.labels?.birthDate ?? 'Birth date'}
                    value={new Date(currentKid.birthDate).toLocaleDateString(locale)}
                  />
                ) : null}
                {currentKid.school ? (
                  <InfoChip
                    icon={School}
                    label={dictionary.playerProfile?.labels?.school ?? 'School'}
                    value={`${currentKid.school}${currentKid.grade ? ` · ${currentKid.grade}` : ''}`}
                  />
                ) : null}
              </div>
            </motion.div>

            {/* Desktop: Stacked buttons on the right */}
            <div className="hidden lg:flex flex-col gap-3 w-48">
              {canAdmin && (
                <Button
                  type="button"
                  onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/edit`)}
                  className="w-full h-11 border-2 border-[#DDDDDD] bg-[#0b0b0f] text-white hover:bg-[#14141a] dark:border-[#000000] justify-start ltr:text-left rtl:text-right"
                >
                  <Edit className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {actionLabel.editProfile}
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={() => setAssessmentDialogOpen(true)}
                  className="w-full h-11 border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114] justify-start ltr:text-left rtl:text-right"
                >
                  <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {actionLabel.newAssessment}
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={openGrantBadgeDialog}
                  className="w-full h-11 border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114] justify-start ltr:text-left rtl:text-right"
                >
                  <Award className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {actionLabel.grantBadge}
                </Button>
              )}

              {canAdmin && (
                <Button
                  type="button"
                  onClick={() => void openProgramLevelDialog()}
                  className="w-full h-11 border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114] justify-start ltr:text-left rtl:text-right"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {actionLabel.adjustProgramLevel}
                </Button>
              )}

              <Button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/card`)}
                className="w-full h-11 border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114] justify-start ltr:text-left rtl:text-right"
              >
                <IdCard className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {actionLabel.viewCard}
              </Button>

              <Button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/achievements`)}
                className="w-full h-11 border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114] justify-start ltr:text-left rtl:text-right"
              >
                <Trophy className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {actionLabel.achievements}
              </Button>
            </div>
          </div>

          {/* Mobile: Inline action bar (right under the profile header box) */}
          <div className="lg:hidden mt-4">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 26 }}
              className="rounded-2xl border-2 border-white/15 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b0f]/95"
            >
              <div className="flex items-center gap-2 overflow-x-auto px-2 pt-2 pb-2">
                {canAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/edit`)}
                    className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-[#0b0b0f] text-white hover:bg-[#14141a] dark:border-[#000000]"
                  >
                    <Edit className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.editProfile}</span>
                  </Button>
                )}

                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAssessmentDialogOpen(true)}
                    className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                  >
                    <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.newAssessment}</span>
                  </Button>
                )}

                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={openGrantBadgeDialog}
                    className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                  >
                    <Award className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.grantBadge}</span>
                  </Button>
                )}

                {canAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void openProgramLevelDialog()}
                    className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.adjustProgramLevel}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/card`)}
                  className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                >
                  <IdCard className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.viewCard}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/achievements`)}
                  className="shrink-0 h-11 rounded-xl border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                >
                  <Trophy className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  <span className="text-xs font-semibold whitespace-nowrap">{actionLabel.achievements}</span>
                </Button>
              </div>

            </motion.div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              <div className="font-semibold text-[#262626] dark:text-white">
                {dictionary.playerProfile?.labels?.progress ?? 'Progress'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                  title={dictionary.playerProfile?.labels?.points ?? 'Total points'}
                  value={totalProgramPoints}
                  icon={Trophy}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.sessions ?? dictionary.programs?.sessionsAttendedLabel ?? 'Sessions attended'}
                  value={totalProgramSessionsAttended}
                  icon={Calendar}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.badges ?? 'Badges'}
                  value={`${profile?.badges?.length ?? 0}/${BADGES.length}`}
                  icon={Award}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.lastAssessment ?? 'Last assessment'}
                  value={latestAssessment ? latestAssessment.sessionDate : '-'}
                  icon={Calendar}
                />
              </div>

              {loadingProfile && (
                <div className="text-sm text-white/70">{dictionary.common.loading}</div>
              )}
              {profileError && (
                <div className="text-sm text-red-600">{profileError}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intentionally no fixed bottom action bar on mobile.
          A global mobile bottom navigation exists; keeping actions inside the header avoids overlap. */}

      <Tabs
        defaultValue="overview"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className="w-full text-start"
      >
        <div className="-mx-4 sm:mx-0">
          <div className="px-4 sm:px-0">
            <OverlayScrollbarsComponent
              className="w-full"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
              options={{
                scrollbars: {
                  theme: 'os-theme-dark',
                  visibility: 'auto',
                  autoHide: 'move',
                  autoHideDelay: 800,
                },
                overflow: {
                  x: 'scroll',
                  y: 'hidden',
                },
              }}
              defer
            >
              <div className="pb-1">
                <TabsList
                  className={`inline-flex w-max min-w-full items-center gap-1 rounded-xl border-2 border-black/60 bg-[#0b0b0f] p-1 shadow-lg shadow-black/30 ${
                    locale === 'ar' ? 'flex-row-reverse justify-end' : 'justify-start'
                  }`}
                >
                  <TabsTrigger
                    value="overview"
                    className={`gap-2 whitespace-nowrap border border-transparent text-white/80 hover:bg-[#14141a] hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/15 ${
                      locale === 'ar' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>{dictionary.playerProfile?.tabs?.overview ?? 'Overview'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="assessments"
                    className={`gap-2 whitespace-nowrap border border-transparent text-white/80 hover:bg-[#14141a] hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/15 ${
                      locale === 'ar' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{dictionary.playerProfile?.tabs?.assessments ?? 'Assessments'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="badges"
                    className={`gap-2 whitespace-nowrap border border-transparent text-white/80 hover:bg-[#14141a] hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/15 ${
                      locale === 'ar' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>{dictionary.playerProfile?.tabs?.badges ?? 'Badges'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="achievements"
                    className={`gap-2 whitespace-nowrap border border-transparent text-white/80 hover:bg-[#14141a] hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/15 ${
                      locale === 'ar' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>{dictionary.playerProfile?.tabs?.achievements ?? 'Achievements'}</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </OverlayScrollbarsComponent>
          </div>
        </div>

        <TabsContent value="overview" className={`mt-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="space-y-6">
            <PanelCard title={dictionary.playerProfile?.sections?.insights ?? 'Insights'} icon={Activity}>
              <div className="space-y-6">
                {!latestAssessment ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {dictionary.playerProfile?.empty?.noAssessments ?? 'No assessments yet.'}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                        <div className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.playerProfile?.labels?.strengths ?? 'Strengths'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {insights?.strengths?.map((k) => (
                            <Badge key={String(k)} className="bg-green-600 text-white border-0">
                              {categoryLabel(String(k))}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                        <div className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.playerProfile?.labels?.developmentAreas ?? 'Development areas'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {insights?.development?.map((k) => (
                            <Badge key={String(k)} variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                              {categoryLabel(String(k))}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-[#262626] dark:text-white mb-3">
                        {dictionary.playerProfile?.labels?.latestAssessment ?? 'Latest assessment'}: {latestAssessment.sessionDate}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
                        {Object.entries(latestAssessment.tests).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-3 sm:p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]"
                          >
                            <div className="text-xs text-gray-600 dark:text-gray-400">{categoryLabel(k)}</div>

                            <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                              <DnaCircularGauge
                                value={Math.round(insights?.scores?.[k] ?? 0)}
                                max={100}
                                size={64}
                                strokeWidth={6}
                                className="shrink-0"
                                ariaLabel={`${categoryLabel(k)} score`}
                              />

                              <div className="text-start">
                                <div className="text-sm font-extrabold text-[#262626] dark:text-white">{v}</div>
                                <div className="mt-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                                  {dictionary.playerProfile?.labels?.rawTestValue ?? 'Raw test value'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </PanelCard>

            <PanelCard title={dictionary.playerProfile?.sections?.status ?? 'Status'} icon={CheckCircle2}>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                  <div className="text-xs text-gray-600 dark:text-gray-400">{dictionary.playerProfile?.labels?.assessmentStatus ?? 'Assessment status'}</div>
                  <div className="mt-1 text-base font-bold text-[#262626] dark:text-white">
                    {assessmentStatusLabel(profile?.assessmentStatus)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]">
                  <div className="text-xs text-gray-600 dark:text-gray-400">{dictionary.playerProfile?.labels?.lastAssessment ?? 'Last assessment'}</div>
                  <div className="mt-1 text-base font-bold text-[#262626] dark:text-white">
                    {latestAssessment ? latestAssessment.sessionDate : '-'}
                  </div>
                </div>

                {loadingProfile && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{dictionary.common.loading}</div>
                )}
                {profileError && (
                  <div className="text-sm text-red-600">{profileError}</div>
                )}
              </div>
            </PanelCard>

            <PanelCard title={dictionary.programs?.playerProgramsTitle ?? dictionary.programs?.title ?? 'Programs'} icon={BookOpen}>
              <div className="space-y-4">
                {loadingProgramEnrollments ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{dictionary.common.loading}</div>
                ) : programEnrollmentsError ? (
                  <div className="text-sm text-red-600">{programEnrollmentsError}</div>
                ) : programEnrollments.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {dictionary.programs?.noPlayerPrograms ?? 'No program memberships yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {programEnrollments.map((e) => (
                      <div
                        key={e.id}
                        className="p-4 rounded-2xl border-2 border-[#DDDDDD] bg-white shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-[#262626] dark:text-white truncate">
                              {e.program ? (locale === 'ar' ? e.program.nameAr : e.program.name) : e.programId}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {e.currentLevel ? (
                                <Badge className="bg-gray-100 text-gray-800 border-0 dark:bg-white/10 dark:text-white dark:border-0">
                                  {dictionary.programs?.currentLevelLabel ?? 'Level'}: {locale === 'ar' ? e.currentLevel.nameAr : e.currentLevel.name}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-700 border-0 dark:bg-white/10 dark:text-white/70 dark:border-0">
                                  {dictionary.programs?.noLevel || 'No level'}
                                </Badge>
                              )}
                              <Badge className="bg-blue-50 text-blue-700 border-0 dark:bg-blue-600/15 dark:text-blue-200 dark:border-0">
                                {dictionary.programs?.pointsLabel ?? 'Points'}: {e.pointsTotal}
                              </Badge>
                              <Badge className="bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-600/15 dark:text-emerald-200 dark:border-0">
                                {dictionary.programs?.sessionsAttendedLabel ?? 'Sessions attended'}: {programAttendanceByProgramId[e.programId]?.attended ?? 0}
                              </Badge>
                              <Badge className="bg-gray-100 text-gray-700 border-0 dark:bg-white/10 dark:text-white/70 dark:border-0">
                                {dictionary.programs?.notesLabel ?? 'Notes'}: {e.coachNotes?.length ?? 0}
                              </Badge>
                            </div>

                            {e.coachNotes?.[0]?.comment ? (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                <span className="font-semibold text-[#262626] dark:text-white">{dictionary.programs?.latestNoteLabel ?? 'Latest'}:</span>{' '}
                                {e.coachNotes[0].comment}
                              </div>
                            ) : null}
                          </div>

                          {canManage && (
                            <Button
                              variant="outline"
                              className="border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                              onClick={() => openProgramNoteDialog(e)}
                            >
                              <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {dictionary.programs?.addNote ?? 'Add note'}
                            </Button>
                          )}
                        </div>

                        {/* Program level journey */}
                        <div className="mt-4 space-y-3">
                          {(() => {
                            const levels = programLevelsByProgramId[e.programId] ?? [];
                            if (levels.length === 0) {
                              return (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{levelJourneyLabels.noLevels}</div>
                              );
                            }

                            const currentLevelIdx = e.currentLevelId ? levels.findIndex((l) => l.id === e.currentLevelId) : -1;

                            const statusFor = (lvl: ProgramLevel) => {
                              if (e.currentLevelId && lvl.id === e.currentLevelId) return 'in_progress' as const;
                              if (currentLevelIdx >= 0 && lvl.order < (levels[currentLevelIdx]?.order ?? 0)) return 'completed' as const;

                              const history = e.levelHistory ?? [];
                              const hasEnded = history.some((h) => h.levelId === lvl.id && Boolean(h.endedAt));
                              if (hasEnded) return 'completed' as const;

                              return 'locked' as const;
                            };

                            const imageSrcFor = (lvl: ProgramLevel) => lvl.image || '';

                            return (
                              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-black/5 via-white/5 to-black/5 p-3 dark:from-white/5 dark:via-white/5 dark:to-black/10">
                                <div className="absolute inset-0 pointer-events-none">
                                  <div
                                    className="absolute -top-16 -left-16 h-48 w-48 rounded-full blur-3xl opacity-30"
                                    style={{ backgroundColor: `${accentColor}55` }}
                                  />
                                  <div
                                    className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-20"
                                    style={{ backgroundColor: `${accentColor}33` }}
                                  />
                                </div>

                                <div className="relative flex items-stretch gap-3 overflow-x-auto pb-2">
                                  {levels.map((lvl, idx) => {
                                    const status = statusFor(lvl);
                                    const isCurrent = status === 'in_progress';
                                    const isCompleted = status === 'completed';
                                    const progressPct =
                                      status === 'completed'
                                        ? 100
                                        : status === 'in_progress'
                                          ? programLevelProgressPct({ enrollment: e, level: lvl, isCurrent })
                                          : 0;

                                    const statusLabel =
                                      status === 'completed'
                                        ? levelJourneyLabels.statusCompleted
                                        : status === 'in_progress'
                                          ? levelJourneyLabels.statusInProgress
                                          : levelJourneyLabels.statusLocked;

                                    return (
                                      <motion.div
                                        key={lvl.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.35 }}
                                        whileHover={{ scale: 1.02, rotateY: locale === 'ar' ? -4 : 4, rotateX: 2 }}
                                        style={{ transformStyle: 'preserve-3d' }}
                                        className={
                                          isCurrent
                                            ? 'relative w-[300px] shrink-0 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg'
                                            : isCompleted
                                              ? 'relative w-[300px] shrink-0 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4'
                                              : 'relative w-[300px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 opacity-80'
                                        }
                                      >
                                        {isCurrent ? (
                                          <motion.div
                                            className="absolute inset-0 rounded-2xl"
                                            animate={{ opacity: [0.35, 0.6, 0.35] }}
                                            transition={{ duration: 2.4, repeat: Infinity }}
                                            style={{ boxShadow: `0 0 0 1px ${accentColor}55, 0 12px 40px -18px ${accentColor}88` }}
                                            aria-hidden
                                          />
                                        ) : null}

                                        <div className={`relative flex items-start gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                          <div
                                            className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 group/img shadow-lg"
                                            style={{ backgroundColor: `${lvl.color}22` }}
                                          >
                                            {imageSrcFor(lvl) ? (
                                              <Image
                                                src={imageSrcFor(lvl)}
                                                alt="Program level artwork"
                                                fill
                                                sizes="128px"
                                                className="object-cover transition-transform group-hover/img:scale-105 duration-300"
                                              />
                                            ) : (
                                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
                                            )}
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2">
                                              <div className="font-bold text-sm text-[#262626] dark:text-white leading-snug">
                                                {getProgramLevelLabel(lvl)}
                                              </div>
                                              <Badge
                                                variant="secondary"
                                                className={
                                                  isCurrent
                                                    ? 'bg-white/10 text-white border-0 dark:bg-white/10 dark:text-white w-fit'
                                                    : isCompleted
                                                      ? 'bg-emerald-600/15 text-emerald-200 border-0 w-fit'
                                                      : 'bg-white/10 text-white/80 border-0 w-fit'
                                                }
                                              >
                                                {statusLabel}
                                              </Badge>
                                            </div>

                                            <div className="mt-2">
                                              {isCurrent ? (() => {
                                                const rulesAny = (lvl.passRules ?? {}) as any;
                                                const requiredSessions = typeof rulesAny.minSessionsAttended === 'number' ? rulesAny.minSessionsAttended : undefined;
                                                const requiredPoints =
                                                  typeof rulesAny.minPointsEarned === 'number'
                                                    ? rulesAny.minPointsEarned
                                                    : (typeof rulesAny.minXpEarned === 'number' ? rulesAny.minXpEarned : undefined);

                                                const sessionsAttended = programAttendanceByProgramId[e.programId]?.attended ?? 0;
                                                const points = Number.isFinite(e.pointsTotal) ? e.pointsTotal : 0;

                                                const sessionsPct =
                                                  typeof requiredSessions === 'number' && requiredSessions > 0
                                                    ? Math.round(Math.max(0, Math.min(1, sessionsAttended / requiredSessions)) * 100)
                                                    : 100;
                                                const pointsPct =
                                                  typeof requiredPoints === 'number' && requiredPoints > 0
                                                    ? Math.round(Math.max(0, Math.min(1, points / requiredPoints)) * 100)
                                                    : 100;

                                                const hasSessionsRule = typeof requiredSessions === 'number' && requiredSessions > 0;
                                                const hasPointsRule = typeof requiredPoints === 'number' && requiredPoints > 0;

                                                return (
                                                  <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                      <span>{levelJourneyLabels.progress}</span>
                                                      <span className="font-semibold text-[#262626] dark:text-white">{progressPct}%</span>
                                                    </div>

                                                    {hasSessionsRule ? (
                                                      <div>
                                                        <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                          <span>{dictionary.playerProfile?.labels?.sessions ?? dictionary.programs?.sessionsAttendedLabel ?? 'Sessions'}</span>
                                                          <span className="font-semibold text-[#262626] dark:text-white">{sessionsPct}%</span>
                                                        </div>
                                                        <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                          <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${sessionsPct}%` }}
                                                            transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
                                                            className="h-full rounded-full"
                                                            style={{ background: `linear-gradient(90deg, ${lvl.color}, #ffffff55)` }}
                                                          />
                                                        </div>
                                                      </div>
                                                    ) : null}

                                                    {hasPointsRule ? (
                                                      <div>
                                                        <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                          <span>{dictionary.programs?.pointsLabel ?? 'Points'}</span>
                                                          <span className="font-semibold text-[#262626] dark:text-white">{pointsPct}%</span>
                                                        </div>
                                                        <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                          <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pointsPct}%` }}
                                                            transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
                                                            className="h-full rounded-full"
                                                            style={{ background: `linear-gradient(90deg, ${lvl.color}, #ffffff55)` }}
                                                          />
                                                        </div>
                                                      </div>
                                                    ) : null}

                                                    {!hasSessionsRule && !hasPointsRule ? (
                                                      <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                        <motion.div
                                                          initial={{ width: 0 }}
                                                          animate={{ width: `${progressPct}%` }}
                                                          transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
                                                          className="h-full rounded-full"
                                                          style={{ background: `linear-gradient(90deg, ${lvl.color}, #ffffff55)` }}
                                                        />
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                );
                                              })() : (
                                                <>
                                                  <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                    <span>{levelJourneyLabels.progress}</span>
                                                    <span className="font-semibold text-[#262626] dark:text-white">{progressPct}%</span>
                                                  </div>
                                                  <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                                    <motion.div
                                                      initial={{ width: 0 }}
                                                      animate={{ width: `${progressPct}%` }}
                                                      transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
                                                      className="h-full rounded-full"
                                                      style={{
                                                        background: isCompleted
                                                          ? 'linear-gradient(90deg, #34d399, #10b981)'
                                                          : `linear-gradient(90deg, ${lvl.color}, #ffffff55)`,
                                                      }}
                                                    />
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                {/* Visited history */}
                                <div className="mt-3">
                                  {(e.levelHistory ?? []).length === 0 ? (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{levelJourneyLabels.noHistory}</div>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                      {[...(e.levelHistory ?? [])]
                                        .slice()
                                        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
                                        .map((h, idx) => {
                                          const lvl = levels.find((x) => x.id === h.levelId);
                                          const label = lvl ? getProgramLevelLabel(lvl) : h.levelId;
                                          const isCurrent = !h.endedAt && e.currentLevelId === h.levelId;
                                          return (
                                            <motion.div
                                              key={`${h.levelId}-${h.startedAt}`}
                                              initial={{ opacity: 0, y: 8 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: idx * 0.03, duration: 0.3 }}
                                              className={
                                                isCurrent
                                                  ? 'rounded-xl border border-white/15 bg-white/10 p-3'
                                                  : 'rounded-xl border border-white/10 bg-white/5 p-3'
                                              }
                                            >
                                              <div className={`flex items-start justify-between gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                                <div className="min-w-0">
                                                  <div className="font-semibold text-[#262626] dark:text-white truncate">{label}</div>
                                                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold text-[#262626] dark:text-white">{levelJourneyLabels.started}:</span>{' '}
                                                    {new Date(h.startedAt).toLocaleDateString(locale)}
                                                    <span className="mx-2">•</span>
                                                    <span className="font-semibold text-[#262626] dark:text-white">{levelJourneyLabels.ended}:</span>{' '}
                                                    {h.endedAt ? new Date(h.endedAt).toLocaleDateString(locale) : '—'}
                                                  </div>
                                                </div>

                                                <Badge
                                                  className={
                                                    isCurrent
                                                      ? 'bg-white/10 text-white border border-white/15'
                                                      : 'bg-emerald-600/15 text-emerald-200 border-0'
                                                  }
                                                >
                                                  {isCurrent ? levelJourneyLabels.statusInProgress : levelJourneyLabels.statusCompleted}
                                                </Badge>
                                              </div>
                                            </motion.div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PanelCard>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className={`mt-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <PanelCard
            title={dictionary.playerProfile?.sections?.assessmentHistory ?? 'Assessment history'}
            icon={Calendar}
          >
            {assessments.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {dictionary.playerProfile?.empty?.noAssessments ?? 'No assessments yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[#262626] dark:text-white">
                          {a.sessionDate}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {dictionary.playerProfile?.labels?.naScore ?? 'NA Score'}: <span className="font-semibold text-[#262626] dark:text-white">{a.naScore}</span>
                        </div>
                      </div>

                      {canAdmin && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-[#DDDDDD] bg-white text-[#262626] hover:bg-gray-50 dark:border-[#000000] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#111114]"
                          onClick={() => handleDeleteAssessment(a.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {dictionary.common.delete}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </PanelCard>
        </TabsContent>

        <TabsContent value="badges" className={`mt-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <PanelCard title={dictionary.playerProfile?.sections?.badges ?? 'Badges'} icon={Star}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BADGES.map((b) => {
                const unlocked = grantedBadgeIds.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={
                      unlocked
                        ? 'rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/10'
                        : 'rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]'
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[#262626] dark:text-white truncate">
                          {t(b.nameKey)}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {unlocked ? t(b.descriptionKey) : t(b.lockedHintKey)}
                        </div>
                      </div>
                      <div>
                        {unlocked ? (
                          <Badge className="bg-emerald-600 text-white border-0">
                            {dictionary.playerProfile?.labels?.unlocked ?? 'Unlocked'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-0 dark:bg-white/10 dark:text-white/80">
                            {dictionary.playerProfile?.labels?.locked ?? 'Locked'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>
        </TabsContent>

        <TabsContent value="achievements" className={`mt-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="space-y-4">
            <PanelCard
              title={dictionary.playerProfile?.achievements?.bilingualTitle ?? (dictionary.playerProfile?.tabs?.achievements ?? 'Achievements')}
              icon={Award}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dictionary.playerProfile?.achievements?.bilingualSubtitle ??
                  (locale === 'ar' ? '' : 'Unlocked medals earned through progress.')}
              </p>
            </PanelCard>

            <StudentMedalsDisplay
              studentId={currentKid.id}
              hideHeader
              locale={locale}
              loadingLabel={dictionary.common?.loading}
              emptyTitle={dictionary.playerProfile?.empty?.noMedals}
              emptyDescription={dictionary.playerProfile?.empty?.noMedalsSubtitle}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Program note dialog */}
      <Dialog
        open={programNoteDialogOpen}
        onOpenChange={(open) => {
          setProgramNoteDialogOpen(open);
          if (!open) setProgramNoteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dictionary.programs?.addNoteTitle ?? 'Add coach note'}</DialogTitle>
            <DialogDescription>
              {programNoteTarget?.program
                ? locale === 'ar'
                  ? programNoteTarget.program.nameAr
                  : programNoteTarget.program.name
                : programNoteTarget?.programId}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{dictionary.programs?.pointsDeltaLabel ?? 'Points change'}</Label>
              <Input
                value={programNotePointsDelta}
                onChange={(e) => setProgramNotePointsDelta(e.target.value)}
                inputMode="numeric"
                placeholder={dictionary.programs?.pointsDeltaHint ?? 'e.g. 5 or -2'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{dictionary.programs?.commentLabel ?? 'Comment'}</Label>
              <Input
                value={programNoteComment}
                onChange={(e) => setProgramNoteComment(e.target.value)}
                placeholder={dictionary.programs?.commentHint ?? 'Short coaching note'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramNoteDialogOpen(false)} disabled={programNoteSubmitting}>
              {dictionary.common.cancel}
            </Button>
            <Button onClick={() => void submitProgramNote()} disabled={programNoteSubmitting}>
              {programNoteSubmitting ? dictionary.common.saving : dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program level dialog */}
      <Dialog
        open={programLevelDialogOpen}
        onOpenChange={(open) => {
          setProgramLevelDialogOpen(open);
          if (!open) {
            setProgramLevelTargetProgramId('');
            setProgramLevelOptions([]);
            setProgramLevelSelectedId(NO_LEVEL_VALUE);
            setProgramLevelPointsDelta('');
            setProgramLevelComment('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dictionary.playerProfile?.actions?.adjustProgramLevel ?? 'Adjust program level'}
            </DialogTitle>
            <DialogDescription>
              {dictionary.programs?.membersDescription ?? 'Update the current level for a program membership.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {programEnrollments.length > 1 ? (
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">{dictionary.programs?.selectedProgram ?? 'Selected program'}</Label>
                <Select
                  value={programLevelTargetProgramId}
                  onValueChange={(v) => void handleProgramLevelTargetProgramChange(v)}
                >
                  <SelectTrigger className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                    <SelectValue placeholder={dictionary.programs?.selectProgramPrompt ?? 'Select a program'} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                    {programEnrollments.map((e) => (
                      <SelectItem key={e.programId} value={e.programId} className="cursor-pointer">
                        {e.program ? (locale === 'ar' ? e.program.nameAr : e.program.name) : e.programId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label className="text-sm font-semibold">{dictionary.programs?.currentLevelLabel ?? 'Level'}</Label>
              <div className="flex items-stretch gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={() => shiftProgramLevel('prev')}
                  disabled={loadingProgramLevelOptions || programLevelOptions.length === 0}
                  aria-label="Previous level"
                  title="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 min-w-0">
                  <Select value={programLevelSelectedId} onValueChange={setProgramLevelSelectedId}>
                    <SelectTrigger className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                      <SelectValue placeholder={dictionary.programs?.noLevel ?? 'No level'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                      <SelectItem value={NO_LEVEL_VALUE} className="cursor-pointer">
                        {dictionary.programs?.noLevel ?? 'No level'}
                      </SelectItem>
                      {[...programLevelOptions]
                        .sort((a, b) => a.order - b.order)
                        .map((lvl) => (
                          <SelectItem key={lvl.id} value={lvl.id} className="cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: lvl.color }}
                                aria-hidden
                              />
                              <span className="font-semibold">{locale === 'ar' ? lvl.nameAr : lvl.name}</span>
                              <span className="text-xs text-muted-foreground">#{lvl.order}</span>
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {loadingProgramLevelOptions ? (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{dictionary.common.loading}</div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={() => shiftProgramLevel('next')}
                  disabled={loadingProgramLevelOptions || programLevelOptions.length === 0}
                  aria-label="Next level"
                  title="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{dictionary.programs?.pointsDeltaLabel ?? 'Points change'}</Label>
                <Input
                  value={programLevelPointsDelta}
                  onChange={(e) => setProgramLevelPointsDelta(e.target.value)}
                  inputMode="numeric"
                  placeholder={dictionary.programs?.pointsDeltaHint ?? 'e.g. 5 or -2'}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{dictionary.programs?.commentLabel ?? 'Comment'}</Label>
                <Input
                  value={programLevelComment}
                  onChange={(e) => setProgramLevelComment(e.target.value)}
                  placeholder={dictionary.programs?.commentHint ?? 'Short coaching note'}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProgramLevelDialogOpen(false)}
              disabled={programLevelSubmitting}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              onClick={() => void handleSaveProgramLevel()}
              disabled={programLevelSubmitting || loadingProgramLevelOptions || !programLevelTargetProgramId}
            >
              <Save className="h-4 w-4 me-2" />
              {programLevelSubmitting ? dictionary.common.saving : dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dictionary.playerProfile?.actions?.newAssessment ?? 'New Assessment'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid gap-2"
            >
              <Label htmlFor="sessionDate">{dictionary.playerProfile?.labels?.assessmentDate ?? 'Assessment date'}</Label>
              <Input
                id="sessionDate"
                type="date"
                value={assessmentForm.sessionDate}
                onChange={(e) => setAssessmentForm((p) => ({ ...p, sessionDate: e.target.value }))}
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(
                [
                  { key: 'speed', icon: Activity },
                  { key: 'agility', icon: Trophy },
                  { key: 'balance', icon: Star },
                  { key: 'power', icon: Award },
                  { key: 'reaction', icon: Flag },
                  { key: 'coordination', icon: BookOpen },
                  { key: 'flexibility', icon: UserCircle },
                ] as const
              ).map((f, idx) => {
                const valueRaw = assessmentForm[f.key];
                const value = Number(valueRaw || 5);
                const Icon = f.icon;
                const inputId = `assessment-${f.key}`;

                return (
                  <motion.div
                    key={f.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ rotate: 8 }}
                            className="shrink-0 rounded-xl border border-white/10 bg-black/30 p-2"
                            aria-hidden
                          >
                            <Icon className="h-5 w-5 text-white/80" />
                          </motion.div>
                          <Label htmlFor={inputId} className="truncate text-white/90">
                            {categoryLabel(f.key)}
                          </Label>
                        </div>
                        <div className="mt-2 text-xs text-white/55">
                          {scoreLabel}: {Math.min(10, Math.max(1, value))}/10
                        </div>
                      </div>

                      <motion.div
                        initial={{ scale: 0.98, opacity: 0.9 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="shrink-0 rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-sm font-bold text-white"
                      >
                        {Math.min(10, Math.max(1, value))}
                      </motion.div>
                    </div>

                    <div className="mt-4">
                      <input
                        id={inputId}
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={Number.isFinite(value) ? String(Math.min(10, Math.max(1, value))) : '5'}
                        onChange={(e) => setAssessmentForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="dna-range w-full"
                        aria-label={categoryLabel(f.key)}
                        title={categoryLabel(f.key)}
                      />

                      <div className="mt-2 flex justify-between text-[11px] text-white/45">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <span
                            key={n}
                            className={
                              n === Math.min(10, Math.max(1, value))
                                ? 'text-white/85 font-semibold'
                                : undefined
                            }
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{dictionary.common.optional}</Label>
              <Input
                id="notes"
                value={assessmentForm.notes}
                onChange={(e) => setAssessmentForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => setAssessmentDialogOpen(false)}
            >
              {dictionary.common.cancel}
            </Button>
            <Button className="bg-[#262626] hover:bg-black text-white" disabled={assessmentSubmitting} onClick={handleCreateAssessment}>
              {assessmentSubmitting ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{dictionary.playerProfile?.actions?.grantBadge ?? 'Grant Badge'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{dictionary.playerProfile?.labels?.selectBadge ?? 'Select badge'}</Label>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <SelectValue placeholder={dictionary.playerProfile?.placeholders?.selectBadge ?? 'Choose a badge'} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  {BADGES.filter((b) => !grantedBadgeIds.has(b.id)).map((b) => (
                    <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                      {t(b.nameKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{dictionary.common.optional}</Label>
              <Input value={badgeNotes} onChange={(e) => setBadgeNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => setBadgeDialogOpen(false)}
            >
              {dictionary.common.cancel}
            </Button>
            <Button className="bg-[#262626] hover:bg-black text-white" disabled={badgeSubmitting || !selectedBadgeId} onClick={handleGrantBadge}>
              {badgeSubmitting ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
