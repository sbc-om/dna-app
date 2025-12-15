'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Users, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dictionary } from '@/lib/i18n/getDictionary';

interface User {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

interface WhatsAppMessagingClientProps {
  dictionary: Dictionary;
  locale: string;
}

export default function WhatsAppMessagingClient({ dictionary, locale }: WhatsAppMessagingClientProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [session, setSession] = useState('Milad');
  const [wahaUrl, setWahaUrl] = useState('http://localhost:3000');
  const [wahaApiKey, setWahaApiKey] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [sendResults, setSendResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on role and search query
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      setErrorMessage('');
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const data = await response.json();
        // Filter users with phone numbers only
        const usersWithPhone = data.users.filter((user: User) => user.phoneNumber);
        setUsers(usersWithPhone);
        setFilteredUsers(usersWithPhone);
      } else {
        setErrorMessage('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to fetch users');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleSendMessages = async () => {
    if (selectedUsers.size === 0) {
      setErrorMessage('Please select at least one user');
      return;
    }

    if (!message.trim()) {
      setErrorMessage('Please enter a message');
      return;
    }

    setIsLoading(true);
    setSendResults(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
      const phoneNumbers = selectedUsersList.map(user => ({
        phoneNumber: user.phoneNumber!,
        name: user.fullName || user.email,
      }));

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumbers,
          message,
          session,
          wahaUrl,
          wahaApiKey,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendResults(data.data);
        setSuccessMessage(data.message);
        setMessage('');
        setSelectedUsers(new Set());
      } else {
        setErrorMessage(data.message || 'Failed to send messages');
      }
    } catch (error) {
      console.error('Error sending messages:', error);
      setErrorMessage('Failed to send messages');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-green-600" />
          {locale === 'ar' ? 'رسائل واتساب' : 'WhatsApp Messaging'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {locale === 'ar' 
            ? 'إرسال رسائل واتساب إلى المستخدمين المحددين'
            : 'Send WhatsApp messages to selected users'}
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-500 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {locale === 'ar' ? 'المستخدمون' : 'Users'}
              {filteredUsers.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({selectedUsers.size} / {filteredUsers.length})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'اختر المستخدمين لإرسال الرسائل إليهم'
                : 'Select users to send messages'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder={locale === 'ar' ? 'البحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                  <SelectValue placeholder={locale === 'ar' ? 'فلترة حسب الدور' : 'Filter by role'} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <SelectItem value="all" className="text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20 cursor-pointer">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role} className="text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20 cursor-pointer">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select All */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4 pb-4 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer font-medium text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'تحديد الكل' : 'Select All'}
                </Label>
              </div>
            )}

            {/* Users List */}
            {isFetchingUsers ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {locale === 'ar' ? 'لم يتم العثور على مستخدمين' : 'No users found'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-custom-dark pr-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-[#262626] dark:text-white">{user.fullName || user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{user.phoneNumber}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          {user.role}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Form */}
        <Card className="lg:col-span-1 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg">
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'الرسالة' : 'Message'}</CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'اكتب رسالتك هنا'
                : 'Write your message here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wahaUrl" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'رابط WAHA API' : 'WAHA API URL'}</Label>
              <Input
                id="wahaUrl"
                value={wahaUrl}
                onChange={(e) => setWahaUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {locale === 'ar' 
                  ? 'عنوان URL لخادم WAHA'
                  : 'WAHA server URL'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wahaApiKey" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'مفتاح API' : 'API Key'}</Label>
              <Input
                id="wahaApiKey"
                type="password"
                value={wahaApiKey}
                onChange={(e) => setWahaApiKey(e.target.value)}
                placeholder={locale === 'ar' ? 'أدخل مفتاح API' : 'Enter API key'}
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {locale === 'ar' 
                  ? 'مفتاح المصادقة لـ WAHA API'
                  : 'WAHA API authentication key'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'الجلسة' : 'Session'}</Label>
              <Input
                id="session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Milad"
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {locale === 'ar' 
                  ? 'اسم جلسة WAHA'
                  : 'WAHA session name'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'نص الرسالة' : 'Message Text'}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                rows={8}
                className="resize-none bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <Button
              onClick={handleSendMessages}
              disabled={isLoading || selectedUsers.size === 0 || !message.trim()}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                  {locale === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {locale === 'ar' ? 'إرسال' : 'Send'}
                  {selectedUsers.size > 0 && ` (${selectedUsers.size})`}
                </>
              )}
            </Button>

            {/* Send Results */}
            {sendResults && (
              <Card className="mt-4 bg-gray-50 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {locale === 'ar' ? 'نتائج الإرسال' : 'Send Results'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {locale === 'ar' ? 'ناجح' : 'Success'}
                    </span>
                    <span className="font-medium">{sendResults.success}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {locale === 'ar' ? 'فشل' : 'Failed'}
                    </span>
                    <span className="font-medium">{sendResults.failed}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
