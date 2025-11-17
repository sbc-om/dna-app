import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { ROLE_LABELS } from '@/config/roles';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const roleLabel = ROLE_LABELS[user.role][locale] || user.role;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1E3A8A]">
          {dictionary.dashboard.welcomeMessage}
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName || user.username}!
        </p>
        <div className="text-sm text-muted-foreground">
          Role: <span className="font-semibold text-[#F2574C]">{roleLabel}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border-2 border-[#1E3A8A]/20">
        <h2 className="text-xl font-bold text-[#1E3A8A] mb-4">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          {user.role === 'admin' && 'You have full system access. Use the sidebar to manage users and system settings.'}
          {user.role === 'coach' && 'Welcome coach! You can manage appointments and schedules.'}
          {user.role === 'parent' && 'Welcome parent! You can view and manage appointments for your children.'}
          {user.role === 'kid' && 'Welcome! You can view your schedule and activities.'}
        </p>
      </div>
    </div>
  );
}
