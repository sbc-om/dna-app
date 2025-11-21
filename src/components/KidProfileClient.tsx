'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { AuthUser } from '@/lib/auth/auth';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Trophy, Activity, Star, Calendar } from 'lucide-react';

interface KidProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User;
  currentUser: AuthUser;
}

export function KidProfileClient({
  dictionary,
  locale,
  kid,
  currentUser,
}: KidProfileClientProps) {
  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="border-t-4 border-t-blue-600 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="bg-blue-100 p-6 rounded-full">
              <UserCircle className="w-20 h-20 text-blue-600" />
            </div>
            <div className="flex-1 text-center md:text-start space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{kid.fullName || kid.username}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-sm">
                  {dictionary.users.role}: {dictionary.users.roles.kid}
                </Badge>
                {kid.nationalId && (
                  <Badge variant="secondary" className="text-sm">
                    {dictionary.users.nationalId}: {kid.nationalId}
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">
                {dictionary.users.createdAt}: {new Date(kid.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Activities, Scores, etc. */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+20% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activities Completed</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No recent activities found.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No score history available.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
