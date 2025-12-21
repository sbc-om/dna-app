'use client';

import type { User } from '@/lib/db/repositories/userRepository';
import type { AuthUser } from '@/lib/auth/auth';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Award,
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
import { useEffect, useMemo, useState } from 'react';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { PlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import {
  ensurePlayerProfileAction,
  evaluatePlayerStageAction,
  approveStageUpgradeAction,
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
  type StageEvaluationActionResult = Awaited<ReturnType<typeof evaluatePlayerStageAction>>;
  type StageEvaluationSuccess = Extract<StageEvaluationActionResult, { success: true }>;
  type EnrichedEnrollment = Enrollment & { course?: Course | null };
  type AssessmentFieldKey = 'speed' | 'agility' | 'balance' | 'power' | 'reaction' | 'coordination' | 'flexibility';
  type AssessmentFormState = { sessionDate: string; notes: string } & Record<AssessmentFieldKey, string>;

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
  const [stageEvaluation, setStageEvaluation] = useState<StageEvaluationSuccess | null>(null);
  const [assessments, setAssessments] = useState<DnaAssessmentSession[]>([]);

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

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'coach';
  const canAdmin = currentUser?.role === 'admin';

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

      const evalRes = await evaluatePlayerStageAction({
        locale,
        academyId,
        userId: kid.id,
      });

      if (evalRes.success) {
        setStageEvaluation(evalRes as StageEvaluationSuccess);
      } else {
        setStageEvaluation(null);
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
      setStageEvaluation(null);
      setAssessments([]);
    } finally {
      setLoadingProfile(false);
    }
  }

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

      // Sync profile XP/status
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

  const handleApproveStageUpgrade = async () => {
    if (!canManage) return;
    const confirmed = confirm(dictionary.common.confirmContinue);
    if (!confirmed) return;

    const res = await approveStageUpgradeAction({
      locale,
      academyId,
      userId: kid.id,
    });
    if (!res.success) {
      alert(res.error || dictionary.common.error);
      return;
    }
    await loadPlayerProfile();
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

  const formatPct = (value: number | undefined) => {
    if (value === undefined || !Number.isFinite(value)) return '0%';
    return `${Math.round(value * 100)}%`;
  };

  const stageLabel = (stageKey?: string) => {
    switch (stageKey) {
      case 'explorer':
        return dictionary.playerProfile?.stages?.explorer ?? 'Explorer';
      case 'foundation':
        return dictionary.playerProfile?.stages?.foundation ?? 'Foundation';
      case 'active_player':
        return dictionary.playerProfile?.stages?.activePlayer ?? 'Active Player';
      case 'competitor':
        return dictionary.playerProfile?.stages?.competitor ?? 'Competitor';
      case 'champion':
        return dictionary.playerProfile?.stages?.champion ?? 'Champion';
      default:
        return dictionary.playerProfile?.stages?.explorer ?? 'Explorer';
    }
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
        return labels?.stageEvaluation ?? 'Stage evaluation';
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
    <Card className="border border-white/10 bg-transparent rounded-2xl shadow-none">
      <CardHeader className="py-4">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          {Icon ? <Icon className="h-4 w-4 text-white/70" /> : null}
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-5">{children}</CardContent>
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
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <Icon className="h-4 w-4 text-white/70" />
      <div className="min-w-0">
        <div className="text-[11px] leading-4 text-white/60 truncate">{label}</div>
        <div className="text-sm font-semibold text-white truncate">{value}</div>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-white/60 truncate">{title}</div>
          <div className="mt-1 text-2xl font-bold text-white truncate">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-white/75" />
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
      <Card className="border border-white/10 bg-transparent rounded-2xl shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5 min-w-0">
              <div className="shrink-0">
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
                    className="w-32 h-32 rounded-2xl object-cover border border-white/15"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center">
                    <UserCircle className="w-16 h-16 text-white/70" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                  {currentKid.fullName || currentKid.username}
                </h1>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/5 border border-white/10 text-white/90">
                    {dictionary.playerProfile?.labels?.stage ?? 'Stage'}: {stageLabel(profile?.currentStage)}
                  </Badge>
                  {latestAssessment && (
                    <Badge variant="secondary" className="bg-white/5 border border-white/10 text-white/90">
                      {dictionary.playerProfile?.labels?.naScore ?? 'NA'}: {latestAssessment.naScore}
                    </Badge>
                  )}
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
              </div>
            </div>

            {/* Desktop: Stacked buttons on the right */}
            <div className="hidden lg:flex flex-col gap-3 w-48">
              {canAdmin && (
                <Button
                  type="button"
                  onClick={() => router.push(`/${locale}/dashboard/kids/${currentKid.id}/edit`)}
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg"
                >
                  <Edit className="h-4 w-4 me-2" />
                  Edit Profile
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={() => setAssessmentDialogOpen(true)}
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 me-2" />
                  New Assessment
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={openGrantBadgeDialog}
                  className="w-full bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg"
                >
                  <Award className="h-4 w-4 me-2" />
                  Grant Badge
                </Button>
              )}
              {canManage && stageEvaluation?.evaluation?.readyForStageUpgrade && (
                <Button
                  type="button"
                  onClick={handleApproveStageUpgrade}
                  className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg"
                >
                  <Flag className="h-4 w-4 me-2" />
                  Approve Stage
                </Button>
              )}
            </div>
          </div>

          {/* Mobile: Action buttons below profile info */}
          <div className="lg:hidden mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid grid-cols-3 gap-2">
                {canAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/kids/${currentKid.id}/edit`)}
                    className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg flex-col h-auto py-3"
                  >
                    <Edit className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Edit</span>
                  </Button>
                )}
                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAssessmentDialogOpen(true)}
                    className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg flex-col h-auto py-3"
                  >
                    <Plus className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Assessment</span>
                  </Button>
                )}
                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={openGrantBadgeDialog}
                    className="bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg flex-col h-auto py-3"
                  >
                    <Award className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Badge</span>
                  </Button>
                )}
                {canManage && stageEvaluation?.evaluation?.readyForStageUpgrade && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApproveStageUpgrade}
                    className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg flex-col h-auto py-3 col-span-3"
                  >
                    <Flag className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Approve Stage</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-white/70" />
              <div className="font-semibold text-white">
                {dictionary.playerProfile?.labels?.progress ?? 'Stage Progress'}
              </div>
            </div>

            <div className="space-y-3">
              <progress
                value={Math.round((stageEvaluation?.evaluation?.overallProgress || 0) * 100)}
                max={100}
                className="w-full h-3 rounded-md overflow-hidden border border-white/10 bg-white/5"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                  title={dictionary.playerProfile?.labels?.daysInStage ?? 'Days in stage'}
                  value={stageEvaluation?.evaluation?.timeInStageDays ?? 0}
                  icon={Calendar}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.attendance ?? 'Attendance'}
                  value={formatPct(stageEvaluation?.attendance?.attendanceRate)}
                  icon={Activity}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.naImprovement ?? 'NA improvement'}
                  value={formatPct(stageEvaluation?.evaluation?.naImprovementPct)}
                  icon={Trophy}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.xp ?? 'XP'}
                  value={profile?.xpTotal ?? 0}
                  icon={Star}
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

      <Tabs defaultValue="overview" className="w-full">
        <div className="-mx-4 sm:mx-0">
          <div className="px-4 sm:px-0">
            <OverlayScrollbarsComponent
              className="w-full"
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
                <TabsList className="inline-flex w-max min-w-full items-center justify-start gap-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-1.5">
                  <TabsTrigger
                    value="overview"
                    className="gap-2 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500/60 data-[state=active]:to-purple-600/60 data-[state=active]:text-white"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden md:inline">{dictionary.playerProfile?.tabs?.overview ?? 'Overview'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="assessments"
                    className="gap-2 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:bg-linear-to-r data-[state=active]:from-orange-500/70 data-[state=active]:to-fuchsia-600/70 data-[state=active]:text-white"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden md:inline">{dictionary.playerProfile?.tabs?.assessments ?? 'Assessments'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="badges"
                    className="gap-2 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500/70 data-[state=active]:to-teal-600/70 data-[state=active]:text-white"
                  >
                    <Star className="w-4 h-4" />
                    <span className="hidden md:inline">{dictionary.playerProfile?.tabs?.badges ?? 'Badges'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="courses"
                    className="gap-2 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:bg-linear-to-r data-[state=active]:from-cyan-500/60 data-[state=active]:to-blue-600/60 data-[state=active]:text-white"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden md:inline">{dictionary.playerProfile?.tabs?.courses ?? 'Courses'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="achievements"
                    className="gap-2 text-white/70 hover:text-white hover:bg-white/5 data-[state=active]:bg-linear-to-r data-[state=active]:from-yellow-500/70 data-[state=active]:to-orange-600/70 data-[state=active]:text-white"
                  >
                    <Award className="w-4 h-4" />
                    <span className="hidden md:inline">{dictionary.playerProfile?.tabs?.achievements ?? 'Achievements'}</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </OverlayScrollbarsComponent>
          </div>
        </div>

        <TabsContent value="overview" className="mt-4">
          <div className="space-y-6">
            <PanelCard title={dictionary.playerProfile?.sections?.insights ?? 'Insights'} icon={Activity}>
              <div className="space-y-6">
                {!latestAssessment ? (
                  <div className="text-white/70">
                    {dictionary.playerProfile?.empty?.noAssessments ?? 'No assessments yet.'}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                        <div className="text-sm font-semibold text-white/85">
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
                      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                        <div className="text-sm font-semibold text-white/85">
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
                      <div className="text-sm font-semibold text-white/85 mb-3">
                        {dictionary.playerProfile?.labels?.latestAssessment ?? 'Latest assessment'}: {latestAssessment.sessionDate}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(latestAssessment.tests).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-3 rounded-2xl border border-white/10 bg-white/5"
                          >
                            <div className="text-xs text-white/55">{categoryLabel(k)}</div>
                            <div className="mt-1 flex items-end justify-between gap-3">
                              <div className="text-lg font-bold text-white">{v}</div>
                              <div className="text-xs font-semibold text-white/65">
                                {Math.round(insights?.scores?.[k] ?? 0)}/100
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
                <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="text-xs text-white/55">{dictionary.playerProfile?.labels?.assessmentStatus ?? 'Assessment status'}</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {assessmentStatusLabel(profile?.assessmentStatus)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="text-xs text-white/55">{dictionary.playerProfile?.labels?.stageStart ?? 'Stage start'}</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {profile?.stageStartDate ? new Date(profile.stageStartDate).toLocaleDateString(locale) : '-'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="text-xs text-white/55">{dictionary.playerProfile?.labels?.lastAssessment ?? 'Last assessment'}</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {latestAssessment ? latestAssessment.sessionDate : '-'}
                  </div>
                </div>

                {loadingProfile && (
                  <div className="text-sm text-white/70">{dictionary.common.loading}</div>
                )}
                {profileError && (
                  <div className="text-sm text-red-600">{profileError}</div>
                )}
              </div>
            </PanelCard>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <Card className="bg-white/6 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_90px_-50px_rgba(0,0,0,0.7)]">
            <CardHeader className="bg-white/5 border-b border-white/10 flex items-center justify-center min-h-14">
              <CardTitle className="text-white text-center">
                {dictionary.playerProfile?.sections?.assessmentHistory ?? 'Assessment history'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {assessments.length === 0 ? (
                <div className="text-white/70">
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
                      className="p-4 rounded-2xl border border-white/10 bg-white/5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-white">
                            {a.sessionDate}
                          </div>
                          <div className="text-sm text-white/70">
                            {dictionary.playerProfile?.labels?.naScore ?? 'NA Score'}: <span className="font-semibold">{a.naScore}</span>
                          </div>
                        </div>
                        {canAdmin && (
                          <Button
                            variant="outline"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                            onClick={() => handleDeleteAssessment(a.id)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {dictionary.common.delete}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <Card className="bg-white/6 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_90px_-50px_rgba(0,0,0,0.7)]">
            <CardHeader className="bg-white/5 border-b border-white/10 flex items-center justify-center min-h-14">
              <CardTitle className="text-white text-center">
                {dictionary.playerProfile?.sections?.badges ?? 'Badges'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BADGES.map((b) => {
                  const unlocked = grantedBadgeIds.has(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border-2 ${
                        unlocked
                          ? 'border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-900/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {t(b.nameKey)}
                          </div>
                          <div className="mt-1 text-sm text-white/70">
                            {unlocked ? t(b.descriptionKey) : t(b.lockedHintKey)}
                          </div>
                        </div>
                        <div>
                          {unlocked ? (
                            <Badge className="bg-green-600 text-white border-0">
                              {dictionary.playerProfile?.labels?.unlocked ?? 'Unlocked'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/10 text-white/80 border border-white/10">
                              {dictionary.playerProfile?.labels?.locked ?? 'Locked'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Card className="bg-white/6 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_90px_-50px_rgba(0,0,0,0.7)]">
            <CardHeader className="bg-white/5 border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-white">
                  {dictionary.playerProfile?.sections?.courses ?? 'Courses'}
                </CardTitle>
                {canAdmin && availableCourses.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => (editingCourse ? handleCancelEdit() : setEditingCourse(true))}
                    className="bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {dictionary.playerProfile?.actions?.addCourse ?? 'Add Course'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {editingCourse && canAdmin ? (
                <div className="space-y-4 p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div>
                    <Label className="text-white font-semibold">
                      {dictionary.playerProfile?.labels?.selectCourse ?? 'Select course'}
                    </Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="mt-2 h-12 bg-black/40 border border-white/10 text-white">
                        <SelectValue placeholder={dictionary.playerProfile?.placeholders?.selectCourse ?? 'Select a course'} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border border-white/10 text-white">
                        {availableCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id} className="cursor-pointer">
                            {locale === 'ar' ? course.nameAr : course.name} - {course.price} {course.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveCourse}
                      disabled={savingCourse || !selectedCourseId}
                      className="bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                    >
                      <Save className="h-4 w-4 me-2" />
                      {dictionary.common.save}
                    </Button>
                    <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleCancelEdit}>
                      {dictionary.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-white/70">
                  {dictionary.playerProfile?.empty?.noCourses ?? 'No courses.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment) => {
                    const isDeleting = deletingEnrollmentId === enrollment.id;
                    const status = enrollment.paymentStatus;
                    const statusLabel =
                      status === 'paid'
                        ? dictionary.payments?.paid || 'Paid'
                        : status === 'pending'
                          ? dictionary.payments?.pending || 'Pending'
                          : dictionary.payments?.rejected || 'Rejected';
                    return (
                      <div
                        key={enrollment.id}
                        className="p-4 rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge
                                className={`border-0 ${
                                  status === 'paid'
                                    ? 'bg-green-600 text-white'
                                    : status === 'pending'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-red-600 text-white'
                                }`}
                              >
                                {status === 'paid' && <CheckCircle2 className="h-3.5 w-3.5 me-1" />}
                                {statusLabel}
                              </Badge>
                              {enrollment.course?.startDate && enrollment.course?.endDate && (
                                <Badge variant="secondary" className="bg-white/10 text-white/80 border border-white/10">
                                  <Calendar className="h-3.5 w-3.5 me-1" />
                                  {new Date(enrollment.course.startDate).toLocaleDateString(locale)} -{' '}
                                  {new Date(enrollment.course.endDate).toLocaleDateString(locale)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {canAdmin && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                                onClick={() => handleEditEnrollment(enrollment)}
                                disabled={isDeleting}
                              >
                                {dictionary.common.edit}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                                onClick={() => handleDeleteEnrollment(enrollment.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 me-1" />
                                {dictionary.common.delete}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <div className="space-y-4">
            <Card className="bg-white/6 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_90px_-50px_rgba(0,0,0,0.7)]">
              <CardHeader className="bg-white/5 border-b border-white/10 flex flex-col items-center justify-center text-center gap-1">
                <CardTitle className="text-white flex items-center gap-2 justify-center">
                  <motion.div
                    animate={{ rotate: [0, -6, 6, -6, 0] }}
                    transition={{ duration: 0.6 }}
                    aria-hidden
                  >
                    <Award className="w-5 h-5 text-white/85" />
                  </motion.div>
                  <span className="tracking-tight">
                    {dictionary.playerProfile?.achievements?.bilingualTitle ?? 'Achievements'}
                  </span>
                </CardTitle>
                <p className="text-sm text-white/65">
                  {dictionary.playerProfile?.achievements?.bilingualSubtitle ?? 'Unlocked medals earned through progress.'}
                </p>
              </CardHeader>
            </Card>

            <StudentMedalsDisplay
              studentId={currentKid.id}
              hideHeader
              locale={locale}
            />
          </div>
        </TabsContent>
      </Tabs>

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
                          Score: {Math.min(10, Math.max(1, value))}/10
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
