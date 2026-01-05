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
import { Textarea } from '@/components/ui/textarea';
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
  grantPlayerBadgeAction,
  syncPlayerProfileAfterAssessmentAction,
} from '@/lib/actions/playerProfileActions';
import {
  createDnaAssessmentAction,
  deleteDnaAssessmentAction,
  getDnaAssessmentsForPlayerAction,
  updateDnaAssessmentNotesAction,
  type DnaAssessmentSession,
} from '@/lib/actions/dnaAssessmentActions';
import { BADGES } from '@/lib/player/badges';
import { calculateCategoryScores } from '@/lib/player/dnaScoring';
import { DnaCircularGauge } from '@/components/DnaCircularGauge';
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
  const [assessments, setAssessments] = useState<DnaAssessmentSession[]>([]);

  const [assessmentDetailsOpen, setAssessmentDetailsOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<DnaAssessmentSession | null>(null);
  const [assessmentNotesDraft, setAssessmentNotesDraft] = useState('');
  const [assessmentTestNotesDraft, setAssessmentTestNotesDraft] = useState<
    Partial<Record<AssessmentFieldKey, string>>
  >({});
  const [assessmentNotesSaving, setAssessmentNotesSaving] = useState(false);

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

  const openAssessmentDetails = (a: DnaAssessmentSession) => {
    setSelectedAssessment(a);
    setAssessmentNotesDraft(a.notes ?? '');
    setAssessmentTestNotesDraft((a.testNotes ?? {}) as Partial<Record<AssessmentFieldKey, string>>);
    setAssessmentDetailsOpen(true);
  };

  const saveAssessmentNotes = async () => {
    if (!selectedAssessment) return;
    setAssessmentNotesSaving(true);

    try {
      const res = await updateDnaAssessmentNotesAction({
        locale,
        academyId,
        playerId: kid.id,
        assessmentId: selectedAssessment.id,
        notes: assessmentNotesDraft.trim() ? assessmentNotesDraft.trim() : undefined,
        testNotes: assessmentTestNotesDraft,
      });

      if (!res.success) {
        alert(res.error || dictionary.common.error);
        return;
      }

      setAssessments((prev) => prev.map((s) => (s.id === res.session.id ? res.session : s)));
      setSelectedAssessment(res.session);
    } catch (error) {
      console.error('Save assessment notes error:', error);
      alert(dictionary.common.error);
    } finally {
      setAssessmentNotesSaving(false);
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

  const actionLabel = {
    editProfile: dictionary.playerProfile?.actions?.editProfile ?? (dictionary.common.edit || 'Edit'),
    newAssessment: dictionary.playerProfile?.actions?.newAssessment ?? 'New assessment',
    grantBadge: dictionary.playerProfile?.actions?.grantBadge ?? 'Grant badge',
    achievements: dictionary.playerProfile?.tabs?.achievements ?? 'Achievements',
  };

  const scoreLabel = dictionary.playerProfile?.labels?.score ?? 'Score';

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
                    {dictionary.playerProfile?.labels?.points ?? 'Points'}: {profile?.pointsTotal ?? 0}
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
                  onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/edit`)}
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg"
                >
                  <Edit className="h-4 w-4 me-2" />
                  {actionLabel.editProfile}
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={() => setAssessmentDialogOpen(true)}
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {actionLabel.newAssessment}
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={openGrantBadgeDialog}
                  className="w-full bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg"
                >
                  <Award className="h-4 w-4 me-2" />
                  {actionLabel.grantBadge}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/achievements`)}
                className="w-full bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg"
              >
                <Trophy className="h-4 w-4 me-2" />
                {actionLabel.achievements}
              </Button>
            </div>
          </div>

          {/* Mobile: Action buttons below profile info */}
          <div className="lg:hidden mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid grid-cols-4 gap-2">
                {canAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/edit`)}
                    className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg flex-col h-auto py-3"
                  >
                    <Edit className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">{actionLabel.editProfile}</span>
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
                    <span className="text-[10px] font-semibold">{actionLabel.newAssessment}</span>
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
                    <span className="text-[10px] font-semibold">{actionLabel.grantBadge}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push(`/${locale}/dashboard/players/${currentKid.id}/achievements`)}
                  className="bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg flex-col h-auto py-3"
                >
                  <Trophy className="h-4 w-4 mb-1" />
                  <span className="text-[10px] font-semibold">
                    {actionLabel.achievements}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-white/70" />
              <div className="font-semibold text-white">
                {dictionary.playerProfile?.labels?.progress ?? 'Progress'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                  title={dictionary.playerProfile?.labels?.points ?? 'Points'}
                  value={profile?.pointsTotal ?? 0}
                  icon={Calendar}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.badges ?? 'Badges'}
                  value={`${profile?.badges?.length ?? 0}/${BADGES.length}`}
                  icon={Activity}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.lastAssessment ?? 'Last assessment'}
                  value={latestAssessment ? latestAssessment.sessionDate : '-'}
                  icon={Trophy}
                />
                <StatTile
                  title={dictionary.playerProfile?.labels?.assessments ?? 'Assessments'}
                  value={assessments.length}
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

      <Tabs defaultValue="overview" className="w-full text-start">
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

        <TabsContent value="overview" className="mt-4">
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
                                showMaxValue={false}
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
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
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
                    whileHover={{ scale: 1.01, rotateY: 2 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a] cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => openAssessmentDetails(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openAssessmentDetails(a);
                    }}
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
                          <Trash2 className="h-4 w-4 me-2" />
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

        {/* Assessment details */}
        <Dialog
          open={assessmentDetailsOpen}
          onOpenChange={(open) => {
            setAssessmentDetailsOpen(open);
            if (!open) {
              setSelectedAssessment(null);
              setAssessmentNotesDraft('');
              setAssessmentTestNotesDraft({});
            }
          }}
        >
          <DialogContent className="sm:max-w-[920px] w-[calc(100vw-1.5rem)] max-h-[calc(100vh-2rem)] overflow-hidden p-0">
            <div className="flex max-h-[calc(100vh-2rem)] flex-col">
              <div className="px-6 pt-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{dictionary.playerProfile?.sections?.assessmentHistory ?? 'Assessment'} </span>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                {selectedAssessment ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 dark:border-[#000000] dark:bg-[#1a1a1a]">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{dictionary.playerProfile?.labels?.naScore ?? 'NA Score'}</div>
                        <div className="mt-1 text-2xl font-black text-[#262626] dark:text-white">{selectedAssessment.naScore}</div>
                      </div>
                      <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 dark:border-[#000000] dark:bg-[#1a1a1a] sm:col-span-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{dictionary.playerProfile?.labels?.latestAssessment ?? 'Session'}</div>
                        <div className="mt-1 text-base font-bold text-[#262626] dark:text-white">{selectedAssessment.sessionDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(selectedAssessment.tests) as AssessmentFieldKey[]).map((k, idx) => {
                        const scores = calculateCategoryScores(selectedAssessment.tests);
                        return (
                          <motion.div
                            key={k}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.25 }}
                            className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-4 shadow-sm dark:border-[#000000] dark:bg-[#1a1a1a]"
                          >
                            <div className="flex items-start gap-4">
                              <DnaCircularGauge
                                value={Math.round(scores[k] ?? 0)}
                                max={100}
                                size={70}
                                strokeWidth={7}
                                valueSuffix="%"
                                showMaxValue={false}
                                className="shrink-0"
                                ariaLabel={`${categoryLabel(k)} score`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-[#262626] dark:text-white">{categoryLabel(k)}</div>
                                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {dictionary.playerProfile?.labels?.rawTestValue ?? 'Value'}:{' '}
                                  <span className="font-semibold text-[#262626] dark:text-white">{selectedAssessment.tests[k]}</span>
                                </div>

                                <div className="mt-3 space-y-2">
                                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {dictionary.programs?.commentLabel ?? 'Note'}
                                  </Label>
                                  <Textarea
                                    value={assessmentTestNotesDraft[k] ?? ''}
                                    onChange={(e) =>
                                      setAssessmentTestNotesDraft((prev) => ({
                                        ...prev,
                                        [k]: e.target.value,
                                      }))
                                    }
                                    className="min-h-[88px] border-2"
                                    placeholder={dictionary.programs?.commentHint ?? 'Write a short note'}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#262626] dark:text-white">
                        {dictionary.programs?.notesLabel ?? 'Notes'}
                      </Label>
                      <Textarea
                        value={assessmentNotesDraft}
                        onChange={(e) => setAssessmentNotesDraft(e.target.value)}
                        className="min-h-[110px] border-2"
                        placeholder={dictionary.programs?.commentHint ?? 'General notes for this session'}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="px-6 pb-6">
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="h-12 border-2" onClick={() => setAssessmentDetailsOpen(false)}>
                    {dictionary.common.cancel}
                  </Button>
                  <Button
                    className="h-12"
                    onClick={() => void saveAssessmentNotes()}
                    disabled={!selectedAssessment || assessmentNotesSaving}
                  >
                    {assessmentNotesSaving ? (dictionary.common.loading ?? 'Saving...') : dictionary.common.save}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="badges" className="mt-4">
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

        <TabsContent value="achievements" className="mt-4">
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

      {/* Assessment dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto text-start">
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

                    <div className="mt-4 dna-range-wrap">
                      <input
                        id={inputId}
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={Number.isFinite(value) ? String(Math.min(10, Math.max(1, value))) : '5'}
                        onChange={(e) => setAssessmentForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="dna-range"
                        aria-label={categoryLabel(f.key)}
                        title={categoryLabel(f.key)}
                      />

                      <div className="dna-range-ticks mt-2 flex justify-between text-[11px] text-white/45">
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
        <DialogContent className="sm:max-w-[520px] text-start">
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
                <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] text-start">
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
