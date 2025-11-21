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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/users`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#1E3A8A]">
            {dictionary.users.parentProfile || 'Parent Profile'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dictionary.users.viewParentDetails || 'View and manage parent and their children'}
          </p>
        </div>
      </div>

      {/* Parent Information Card */}
      <Card className="border-2 border-[#1E3A8A]/20">
        <CardHeader className="bg-gradient-to-r from-[#1E3A8A]/10 to-[#30B2D2]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
              <UserCircle className="h-7 w-7" />
              {parent.fullName || parent.username}
            </CardTitle>
            <Badge className="bg-[#F2574C] text-white border-0">
              {dictionary.users.roles?.parent || 'Parent'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#30B2D2]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.common.email}</p>
                <p className="font-semibold">{parent.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#30B2D2]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.common.phoneNumber}</p>
                <p className="font-semibold">{parent.phoneNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#30B2D2]" />
              <div>
                <p className="text-sm text-muted-foreground">{dictionary.users.createdAt || 'Created At'}</p>
                <p className="font-semibold">
                  {new Date(parent.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-[#30B2D2]" />
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
          <h2 className="text-2xl font-bold text-[#1E3A8A]">
            {dictionary.users.children || 'Children'} ({children.length})
          </h2>
          {(currentUser.role === 'admin' || currentUser.id === parent.id) && (
            <Button
              onClick={() => setAddChildOpen(true)}
              className="bg-[#F2574C] hover:bg-[#d94841] text-white flex items-center gap-2"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Link key={child.id} href={`/${locale}/dashboard/kids/${child.id}`}>
                <Card className="border-2 border-gray-200 hover:border-[#30B2D2] hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#30B2D2]" />
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
            <DialogTitle className="text-2xl font-bold text-[#1E3A8A]">
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">
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
              className="bg-[#F2574C] hover:bg-[#d94841] text-white"
              disabled={loading}
            >
              {loading ? dictionary.common.loading : (dictionary.users.addChild || 'Add Child')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
