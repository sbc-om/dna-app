import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <ShieldX className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {dictionary.errors?.forbidden || 'Access Denied'}
          </CardTitle>
          <CardDescription>
            {dictionary.errors?.forbiddenMessage || 'You do not have permission to access this resource'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground text-center">
            {dictionary.errors?.contactAdmin || 'If you believe this is an error, please contact your administrator'}
          </p>
          <Link href={`/${locale}/dashboard`} className="w-full">
            <Button className="w-full">
              {dictionary.common?.backToDashboard || 'Back to Dashboard'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
