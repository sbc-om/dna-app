'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { AuthUser } from '@/lib/auth/auth';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Trophy, Activity, Star, Calendar, CreditCard, Edit } from 'lucide-react';
import { PlayerCardGenerator } from '@/components/PlayerCardGenerator';
import { PlayerCardDisplay } from '@/components/PlayerCardDisplay';
import { ImageUpload } from '@/components/ImageUpload';
import { getPlayerCardAction } from '@/lib/actions/playerCardActions';
import { updateUserProfilePictureAction } from '@/lib/actions/userActions';
import { useEffect, useState } from 'react';
import { PlayerCardData } from '@/lib/db/repositories/playerCardRepository';

interface KidProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User | any;
  currentUser: AuthUser | any;
}

export function KidProfileClient({
  dictionary,
  locale,
  kid,
  currentUser,
}: KidProfileClientProps) {
  const [playerCard, setPlayerCard] = useState<PlayerCardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [currentKid, setCurrentKid] = useState<User>(kid);

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    try {
      const result = await updateUserProfilePictureAction(currentKid.id, croppedImageUrl);
      if (result.success && result.user) {
        setCurrentKid(result.user);
      } else {
        alert(result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      alert('Failed to upload profile picture');
    }
  };

  useEffect(() => {
    // Only load player card for admin
    if (currentUser.role !== 'admin') {
      setLoadingCard(false);
      return;
    }

    async function loadPlayerCard() {
      try {
        const result = await getPlayerCardAction(kid.id);
        if (result.success && result.card) {
          setPlayerCard(result.card);
        }
      } catch (error) {
        console.error('Failed to load player card:', error);
      } finally {
        setLoadingCard(false);
      }
    }
    loadPlayerCard();
  }, [kid.id, currentUser.role]);

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {currentUser.role === 'admin' && (
              <div className="flex flex-col items-center gap-3">
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={currentKid.profilePicture}
                  aspectRatio={1}
                  maxSizeMB={2}
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{currentKid.fullName || currentKid.username}</h1>
                {currentUser.role === 'admin' && (
                  <Button
                    onClick={() => window.location.href = `/${locale}/dashboard/kids/${currentKid.id}/edit`}
                    variant="outline"
                    size="sm"
                    className="border-[#30B2D2] text-[#30B2D2] hover:bg-[#30B2D2] hover:text-white"
                  >
                    <Edit className="h-4 w-4 me-2" />
                    {dictionary.users.editUser}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-sm">
                  {dictionary.users.role}: {dictionary.users.roles.kid}
                </Badge>
                {currentKid.nationalId && (
                  <Badge variant="secondary" className="text-sm">
                    {dictionary.users.nationalId}: {currentKid.nationalId}
                  </Badge>
                )}
                {currentKid.birthDate && (
                  <Badge variant="secondary" className="text-sm">
                    Birth: {new Date(currentKid.birthDate).toLocaleDateString(locale)}
                  </Badge>
                )}
              </div>
              <div className="text-gray-500 space-y-1">
                {currentKid.school && <p>🏫 {currentKid.school} {currentKid.grade && `- Grade ${currentKid.grade}`}</p>}
                {currentKid.position && <p>⚽ Position: {currentKid.position}</p>}
                <p className="text-sm">
                  {dictionary.users.createdAt}: {new Date(currentKid.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Activities, Scores, etc. */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`grid w-full ${currentUser.role === 'admin' ? 'grid-cols-4 lg:w-[500px]' : 'grid-cols-3 lg:w-[400px]'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {currentUser.role === 'admin' && (
            <TabsTrigger value="playercard">
              <CreditCard className="h-4 w-4 me-2" />
              Player Card
            </TabsTrigger>
          )}
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

        {currentUser.role === 'admin' && (
          <TabsContent value="playercard" className="space-y-4 mt-4">
            {loadingCard ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">Loading player card...</div>
                </CardContent>
              </Card>
            ) : playerCard ? (
              <PlayerCardDisplay card={playerCard} />
            ) : (
              <PlayerCardGenerator 
                dictionary={dictionary} 
                locale={locale} 
                userId={currentKid.id} 
                userName={currentKid.fullName || currentKid.username} 
              />
            )}
          </TabsContent>
        )}

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
