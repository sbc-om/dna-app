'use client';

import { useState } from 'react';
import { User, Plus, ArrowLeft, Mail, Phone, UserCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { User as UserType } from '@/lib/db/repositories/userRepository';
import { createUserAction } from '@/lib/actions/userActions';

interface ParentProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  parent: UserType | any;
  children: UserType[] | any[];
  currentUser: UserType | any;
}

export function ParentProfileClient({
  dictionary,
  locale,
  parent,
  children: initialChildren,
  currentUser,
}: ParentProfileClientProps) {
  const [children, setChildren] = useState(initialChildren);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [childData, setChildData] = useState({
    fullName: '',
    nationalId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddChild = async () => {
    if (!childData.fullName || !childData.nationalId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    // Create child account with national ID as username
    const result = await createUserAction({
      email: `${childData.nationalId}@kid.local`, // Using national ID as part of email
      username: childData.nationalId,
      fullName: childData.fullName,
      nationalId: childData.nationalId,
      password: '11111111',
      role: 'kid',
      parentId: parent.id,
    });

    setLoading(false);

    if (result.success) {
      alert(`Child account created successfully!\n\nNational ID: ${childData.nationalId}\nPassword: 11111111`);
      setChildren([...children, result.user!]);
      setAddChildOpen(false);
      setChildData({ fullName: '', nationalId: '' });
      // Reload page to refresh data
      window.location.reload();
    } else {
      alert(`Failed to create child account: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDDDDD] dark:bg-[#000000]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/users`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#262626] dark:text-white">
            {dictionary.users.parentProfile || 'Parent Profile'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dictionary.users.viewParentDetails || 'View and manage parent and their children'}
          </p>
        </div>
      </div>

      {/* Parent Information Card */}
      <Card className="border-2 border-[#DDDDDD] dark:border-[#262626]">
        <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#262626]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[#262626] flex items-center gap-2">
              <UserCircle className="h-7 w-7" />
              {parent.fullName || parent.username}
            </CardTitle>
            <Badge className="bg-[#FF5F02] text-white border-0">
              {dictionary.users.roles?.parent || 'Parent'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#FF5F02]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.common.email}</p>
                <p className="font-semibold">{parent.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#FF5F02]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.common.phoneNumber}</p>
                <p className="font-semibold">{parent.phoneNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#FF5F02]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.users.createdAt || 'Created At'}</p>
                <p className="font-semibold">
                  {new Date(parent.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-[#FF5F02]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.users.status || 'Status'}</p>
                <Badge variant={parent.isActive ? 'default' : 'destructive'}>
                  {parent.isActive ? (dictionary.users.active || 'Active') : (dictionary.users.inactive || 'Inactive')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#262626] dark:text-white">
            {dictionary.users.children || 'Children'} ({children.length})
          </h2>
          {(currentUser.role === 'admin' || currentUser.id === parent.id) && (
            <Button
              onClick={() => setAddChildOpen(true)}
              className="bg-[#FF5F02] hover:bg-[#262626] text-white flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {dictionary.users.addChild || 'Add Child'}
            </Button>
          )}
        </div>

        {children.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {dictionary.users.noChildren || 'No children added yet'}
            </p>
          </Card>
        ) : children.length === 1 ? (
          // Single Child - Large Card
          <Link href={`/${locale}/dashboard/kids/${children[0].id}`}>
            <Card className="border-2 border-[#FF5F02] hover:shadow-2xl transition-all cursor-pointer overflow-hidden">
              <CardHeader className="bg-linear-to-r from-[#FF5F02] to-[#FF5F02]/80 text-white pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {children[0].profilePicture ? (
                        <img
                          src={children[0].profilePicture}
                          alt={children[0].fullName || children[0].username}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </div>
                    <span>{children[0].fullName || children[0].username}</span>
                  </CardTitle>
                  <Badge variant={children[0].isActive ? 'default' : 'destructive'} className="text-base px-4 py-2">
                    {children[0].isActive ? (dictionary.users.active || 'Active') : (dictionary.users.inactive || 'Inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-[#DDDDDD]/30 dark:bg-[#262626]/30 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-[#FF5F02]/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-[#FF5F02]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{dictionary.users.nationalId || 'National ID'}</p>
                      <p className="text-lg font-bold text-[#262626] dark:text-white truncate">{children[0].nationalId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-[#DDDDDD]/30 dark:bg-[#262626]/30 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-[#FF5F02]/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-[#FF5F02]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                      <p className="text-lg font-bold text-[#262626] dark:text-white">
                        {children[0].dateOfBirth ? new Date(children[0].dateOfBirth).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-[#DDDDDD]/30 dark:bg-[#262626]/30 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-[#FF5F02]/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-[#FF5F02]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="text-lg font-bold text-[#262626] dark:text-white truncate">{children[0].email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-linear-to-r from-[#FF5F02]/5 to-[#FF5F02]/10 rounded-lg border-l-4 border-[#FF5F02]">
                  <p className="text-sm text-muted-foreground mb-1">{dictionary.users.createdAt || 'Member Since'}</p>
                  <p className="text-base font-semibold text-[#262626] dark:text-white">
                    {new Date(children[0].createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          // Multiple Children - Grid Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Link key={child.id} href={`/${locale}/dashboard/kids/${child.id}`}>
                <Card className="border-2 border-[#DDDDDD] dark:border-[#262626] hover:border-[#FF5F02] hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-[#262626] dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-[#FF5F02]" />
                      {child.fullName || child.username}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{dictionary.users.nationalId || 'National ID'}</p>
                      <p className="font-semibold">{child.nationalId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{dictionary.users.createdAt || 'Created At'}</p>
                      <p className="text-sm">
                        {new Date(child.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                    <Badge variant={child.isActive ? 'default' : 'destructive'} className="mt-2">
                      {child.isActive ? (dictionary.users.active || 'Active') : (dictionary.users.inactive || 'Inactive')}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Dialog */}
      <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#262626] dark:text-white">
              {dictionary.users.addChild || 'Add Child'}
            </DialogTitle>
            <DialogDescription>
              {dictionary.users.addChildDescription || 'Add a new child for this parent. Default password is 11111111.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fullName">{dictionary.common.fullName}</Label>
              <Input
                id="fullName"
                value={childData.fullName}
                onChange={(e) => setChildData({ ...childData, fullName: e.target.value })}
                placeholder={dictionary.users.fullNamePlaceholder || 'Enter child full name'}
              />
            </div>
            <div>
              <Label htmlFor="nationalId">{dictionary.users.nationalId || 'National ID'}</Label>
              <Input
                id="nationalId"
                value={childData.nationalId}
                onChange={(e) => setChildData({ ...childData, nationalId: e.target.value })}
                placeholder={dictionary.users.nationalIdPlaceholder || 'Enter national ID number'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {dictionary.users.nationalIdNote || 'This will be used as the login username'}
              </p>
            </div>
            <div className="bg-[#DDDDDD] dark:bg-[#262626] p-3 rounded-lg">
              <p className="text-sm font-semibold text-[#262626] dark:text-white">
                {dictionary.users.defaultPassword || 'Default Password'}: 11111111
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChildOpen(false)} disabled={loading}>
              {dictionary.common.cancel}
            </Button>
            <Button
              onClick={handleAddChild}
              className="bg-[#FF5F02] hover:bg-[#262626] text-white"
              disabled={loading}
            >
              {loading ? dictionary.common.loading : (dictionary.users.addChild || 'Add Child')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
