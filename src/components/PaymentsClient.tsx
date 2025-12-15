'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, DollarSign, Calendar, 
  User as UserIcon, Eye, FileText, MoreVertical, 
  Check, X, AlertCircle, RefreshCw, Search,
  TrendingUp, TrendingDown, Minus, Download, CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getMyEnrollmentsAction, getAllEnrollmentsAction, updatePaymentStatusAction } from '@/lib/actions/enrollmentActions';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { User } from '@/lib/db/repositories/userRepository';

interface EnrollmentWithDetails extends Enrollment {
  course?: Course | null;
  student?: User | null;
}

interface PaymentsClientProps {
  locale: string;
  dict: any;
  currentUser: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
}

export default function PaymentsClient({ locale, dict, currentUser }: PaymentsClientProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'paid' | 'rejected'>('paid');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const enrollmentsResult = currentUser.role === 'admin' 
      ? await getAllEnrollmentsAction()
      : await getMyEnrollmentsAction();
      
    if (enrollmentsResult.success && enrollmentsResult.enrollments) {
      setEnrollments(enrollmentsResult.enrollments);
    }
    
    setLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedEnrollment) return;

    setUpdating(true);
    try {
      const result = await updatePaymentStatusAction(
        selectedEnrollment.id,
        newStatus,
        notes || undefined
      );

      if (result.success) {
        setEnrollments(prevEnrollments => 
          prevEnrollments.map(enr => 
            enr.id === selectedEnrollment.id 
              ? { ...enr, paymentStatus: newStatus, paymentDate: newStatus === 'paid' ? new Date().toISOString() : enr.paymentDate }
              : enr
          )
        );

        const statusText = newStatus === 'paid' 
          ? (locale === 'ar' ? 'مدفوع' : 'Paid')
          : newStatus === 'pending' 
          ? (locale === 'ar' ? 'قيد الانتظار' : 'Pending')
          : (locale === 'ar' ? 'مرفوض' : 'Rejected');

        toast.success(
          locale === 'ar' 
            ? `✅ تم تغيير حالة الدفع إلى "${statusText}"`
            : `✅ Payment status changed to "${statusText}"`,
          {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#10b981',
              color: '#fff',
              fontWeight: '600',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );

        setStatusDialogOpen(false);
        setSelectedEnrollment(null);
        setNotes('');
      } else {
        toast.error(
          result.error || (locale === 'ar' ? '❌ حدث خطأ أثناء التحديث' : '❌ An error occurred'),
          {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ef4444',
              color: '#fff',
              fontWeight: '600',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error(
        locale === 'ar' ? '❌ حدث خطأ غير متوقع' : '❌ An unexpected error occurred',
        {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '600',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-600 text-white border-0 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {locale === 'ar' ? 'مدفوع' : 'Paid'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-600 text-white border-0 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {locale === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-600 text-white border-0 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            {locale === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] text-[#262626] dark:text-white flex items-center gap-1">
            <Minus className="w-3.5 h-3.5" />
            {locale === 'ar' ? 'غير مدفوع' : 'Unpaid'}
          </Badge>
        );
    }
  };

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enr => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      enr.student?.fullName?.toLowerCase().includes(query) ||
      enr.course?.name?.toLowerCase().includes(query) ||
      enr.course?.nameAr?.includes(query)
    );
  });

  const pendingEnrollments = filteredEnrollments.filter(e => e.paymentStatus === 'pending');
  const paidEnrollments = filteredEnrollments.filter(e => e.paymentStatus === 'paid');
  const unpaidEnrollments = filteredEnrollments.filter(e => !e.paymentStatus);
  const rejectedEnrollments = filteredEnrollments.filter(e => e.paymentStatus === 'rejected');

  // Calculate statistics
  const totalAmount = enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);
  const paidAmount = paidEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);
  const pendingAmount = pendingEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);
  const unpaidAmount = unpaidEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-[#FF5F02]" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Admin View
  if (currentUser.role === 'admin') {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-[#FF5F02]" />
              {locale === 'ar' ? 'إدارة المدفوعات' : 'Payment Management'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {locale === 'ar' ? 'مراجعة وإدارة مدفوعات الطلاب' : 'Review and manage student payments'}
            </p>
          </div>
          <Button 
            onClick={loadData} 
            variant="outline"
            className="flex items-center gap-2 h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#0a0a0a] hover:border-[#FF5F02] dark:hover:border-[#FF5F02] active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 dark:border-green-900 bg-white dark:bg-[#262626]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {locale === 'ar' ? 'المدفوعات' : 'Paid'}
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-2">
                    {paidAmount.toLocaleString()} {locale === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    {paidEnrollments.length} {locale === 'ar' ? 'معاملة' : 'transactions'}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-green-700 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-900 bg-white dark:bg-[#262626]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    {locale === 'ar' ? 'قيد المراجعة' : 'Pending'}
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-2">
                    {pendingAmount.toLocaleString()} {locale === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                    {pendingEnrollments.length} {locale === 'ar' ? 'معاملة' : 'transactions'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                  <Clock className="w-6 h-6 text-orange-700 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 dark:border-red-900 bg-white dark:bg-[#262626]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {locale === 'ar' ? 'غير مدفوع' : 'Unpaid'}
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-2">
                    {unpaidAmount.toLocaleString()} {locale === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                    {unpaidEnrollments.length} {locale === 'ar' ? 'معاملة' : 'transactions'}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                  <TrendingDown className="w-6 h-6 text-red-700 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {locale === 'ar' ? 'الإجمالي' : 'Total'}
                  </p>
                  <p className="text-2xl font-bold text-[#262626] dark:text-white mt-2">
                    {totalAmount.toLocaleString()} {locale === 'ar' ? 'ر.ع' : 'OMR'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {enrollments.length} {locale === 'ar' ? 'معاملة' : 'transactions'}
                  </p>
                </div>
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <DollarSign className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="p-1.5 bg-[#FF5F02]/10 dark:bg-[#FF5F02]/20 rounded-lg">
              <Search className="w-4 h-4 text-[#FF5F02]" />
            </div>
          </div>
          <Input
            placeholder={locale === 'ar' ? 'بحث عن طالب أو دورة...' : 'Search for student or course...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 rtl:pl-4 rtl:pr-12 h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
              <Badge variant="secondary" className="ml-1 rtl:ml-0 rtl:mr-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">{pendingEnrollments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="paid" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'مدفوع' : 'Paid'}</span>
              <Badge variant="secondary" className="ml-1 rtl:ml-0 rtl:mr-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{paidEnrollments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="unpaid" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'غير مدفوع' : 'Unpaid'}</span>
              <Badge variant="secondary" className="ml-1 rtl:ml-0 rtl:mr-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{unpaidEnrollments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'مرفوض' : 'Rejected'}</span>
              <Badge variant="secondary" className="ml-1 rtl:ml-0 rtl:mr-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{rejectedEnrollments.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingEnrollments.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626]">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {locale === 'ar' ? 'لا توجد مدفوعات قيد المراجعة' : 'No pending payments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-2 border-orange-200 dark:border-orange-900 bg-white dark:bg-[#262626]">
                    <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1 text-[#262626] dark:text-white">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{enrollment.student?.fullName}</span>
                          </div>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                          <span className="font-bold text-lg text-[#262626] dark:text-white">
                            {enrollment.course?.price} {enrollment.course?.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}</span>
                          <span className="font-medium text-[#262626] dark:text-white">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                        {enrollment.paymentProofUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedImage(enrollment.paymentProofUrl || null);
                              setImageDialogOpen(true);
                            }}
                            className="w-full mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-[#FF5F02] dark:hover:border-[#FF5F02]"
                          >
                            <Eye className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {locale === 'ar' ? 'عرض إثبات الدفع' : 'View Payment Proof'}
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setNewStatus('paid');
                            setNotes('');
                            setStatusDialogOpen(true);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white active:scale-95 transition-transform"
                        >
                          <Check className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {locale === 'ar' ? 'موافقة' : 'Approve'}
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setNewStatus('rejected');
                            setNotes('');
                            setStatusDialogOpen(true);
                          }}
                          variant="destructive"
                          className="flex-1 active:scale-95 transition-transform"
                        >
                          <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {locale === 'ar' ? 'رفض' : 'Reject'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Paid Tab */}
          <TabsContent value="paid" className="space-y-4">
            {paidEnrollments.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626]">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {locale === 'ar' ? 'لا توجد مدفوعات مكتملة' : 'No completed payments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paidEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-2 border-green-200 dark:border-green-800 bg-white dark:bg-[#262626]">
                    <CardHeader className="bg-green-50 dark:bg-green-950/30 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1 text-[#262626] dark:text-white">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{enrollment.student?.fullName}</span>
                          </div>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                          <span className="font-bold text-lg text-green-700 dark:text-green-400">
                            {enrollment.course?.price} {enrollment.course?.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</span>
                          <span className="font-medium text-[#262626] dark:text-white">
                            {enrollment.paymentDate ? new Date(enrollment.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-gray-100 active:scale-95 transition-all"
                          >
                            <MoreVertical className="w-4 h-4 mr-2" />
                            {locale === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{locale === 'ar' ? 'تحديث حالة الدفع' : 'Update Payment Status'}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('pending');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                            <span>{locale === 'ar' ? 'قيد الانتظار' : 'Mark as Pending'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('rejected');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <X className="w-4 h-4 mr-2 text-red-600" />
                            <span>{locale === 'ar' ? 'رفض' : 'Mark as Rejected'}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Unpaid Tab */}
          <TabsContent value="unpaid" className="space-y-4">
            {unpaidEnrollments.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626]">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {locale === 'ar' ? 'جميع الطلاب دفعوا' : 'All students have paid'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unpaidEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-2 border-red-200 dark:border-red-900 bg-white dark:bg-[#262626]">
                    <CardHeader className="bg-red-50 dark:bg-red-950/30 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1 text-[#262626] dark:text-white">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{enrollment.student?.fullName}</span>
                          </div>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}</span>
                          <span className="font-bold text-lg text-red-700 dark:text-red-400">
                            {enrollment.course?.price} {enrollment.course?.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}</span>
                          <span className="font-medium text-[#262626] dark:text-white">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            className="w-full h-10 bg-[#262626] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black active:scale-95 transition-transform"
                          >
                            <MoreVertical className="w-4 h-4 mr-2" />
                            {locale === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                          <DropdownMenuLabel className="text-[#262626] dark:text-white">{locale === 'ar' ? 'تحديث حالة الدفع' : 'Update Payment Status'}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('paid');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            <span>{locale === 'ar' ? 'تم الدفع نقداً' : 'Mark as Paid (Cash)'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('rejected');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <X className="w-4 h-4 mr-2 text-red-600" />
                            <span>{locale === 'ar' ? 'رفض' : 'Mark as Rejected'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('pending');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                            <span>{locale === 'ar' ? 'قيد الانتظار' : 'Mark as Pending'}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedEnrollments.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626]">
                <CardContent className="p-12 text-center">
                  <XCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {locale === 'ar' ? 'لا توجد مدفوعات مرفوضة' : 'No rejected payments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rejectedEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-2 border-red-300 dark:border-red-900 bg-white dark:bg-[#262626]">
                    <CardHeader className="bg-red-50 dark:bg-red-950/30 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1 text-[#262626] dark:text-white">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{enrollment.student?.fullName}</span>
                          </div>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                          <span className="font-bold text-lg text-red-700 dark:text-red-400">
                            {enrollment.course?.price} {enrollment.course?.currency}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full h-10 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white hover:bg-gray-100 dark:hover:bg-[#0a0a0a] active:scale-95 transition-all"
                          >
                            <MoreVertical className="w-4 h-4 mr-2" />
                            {locale === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                          <DropdownMenuLabel className="text-[#262626] dark:text-white">{locale === 'ar' ? 'تحديث حالة الدفع' : 'Update Payment Status'}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('paid');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            <span>{locale === 'ar' ? 'موافقة' : 'Approve'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setNewStatus('pending');
                              setNotes('');
                              setStatusDialogOpen(true);
                            }}
                            className="cursor-pointer text-[#262626] dark:text-white hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20"
                          >
                            <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                            <span>{locale === 'ar' ? 'قيد الانتظار' : 'Mark as Pending'}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  newStatus === 'paid' 
                    ? 'bg-linear-to-br from-green-100 to-emerald-100 text-green-700' 
                    : newStatus === 'rejected'
                    ? 'bg-linear-to-br from-red-100 to-rose-100 text-red-700'
                    : 'bg-linear-to-br from-orange-100 to-yellow-100 text-orange-700'
                }`}>
                  {newStatus === 'paid' && <Check className="w-6 h-6" />}
                  {newStatus === 'rejected' && <X className="w-6 h-6" />}
                  {newStatus === 'pending' && <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {locale === 'ar' ? 'تغيير حالة الدفع' : 'Change Payment Status'}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {locale === 'ar' 
                      ? `تحويل الحالة إلى "${newStatus === 'paid' ? 'مدفوع' : newStatus === 'pending' ? 'قيد الانتظار' : 'مرفوض'}"`
                      : `Update status to "${newStatus === 'paid' ? 'Paid' : newStatus === 'pending' ? 'Pending' : 'Rejected'}"`
                    }
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedEnrollment && (
                <div className="space-y-3 p-4 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{locale === 'ar' ? 'الدورة' : 'Course'}:</span>
                    <span className="font-semibold text-[#262626] dark:text-white">
                      {locale === 'ar' ? selectedEnrollment.course?.nameAr : selectedEnrollment.course?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{locale === 'ar' ? 'الطالب' : 'Student'}:</span>
                    <span className="font-semibold text-[#262626] dark:text-white">{selectedEnrollment.student?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{locale === 'ar' ? 'المبلغ' : 'Amount'}:</span>
                    <span className="font-bold text-lg text-[#FF5F02]">
                      {selectedEnrollment.course?.price} {selectedEnrollment.course?.currency}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={locale === 'ar' ? 'أضف ملاحظات أو سبب التغيير...' : 'Add notes or reason for change...'}
                  className="h-24 resize-none bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                disabled={updating}
                className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white hover:bg-gray-100 dark:hover:bg-[#0a0a0a] active:scale-95 transition-all"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className={`active:scale-95 transition-transform ${
                  newStatus === 'paid'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : newStatus === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#262626] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black'
                }`}
              >
                {updating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {locale === 'ar' ? 'جارٍ التحديث...' : 'Updating...'}
                  </span>
                ) : (
                  <>
                    {newStatus === 'paid' && <Check className="w-4 h-4 mr-2" />}
                    {newStatus === 'rejected' && <X className="w-4 h-4 mr-2" />}
                    {newStatus === 'pending' && <AlertCircle className="w-4 h-4 mr-2" />}
                    {locale === 'ar' ? 'تأكيد التغيير' : 'Confirm Change'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{locale === 'ar' ? 'إثبات الدفع' : 'Payment Proof'}</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="relative w-full h-[500px] bg-gray-100 dark:bg-[#1a1a1a] rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Payment Proof"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setImageDialogOpen(false)}>
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Parent View - Simple view for parents
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-[#262626] dark:text-white">
          {locale === 'ar' ? 'المدفوعات' : 'Payments'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {locale === 'ar' ? 'إدارة مدفوعات الدورات التدريبية' : 'Manage course payments'}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626]">
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {locale === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[#262626] dark:text-white">
                      {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                    </CardTitle>
                    <CardDescription className="mt-2 text-[#262626] dark:text-white font-bold">
                      {enrollment.course?.price} {enrollment.course?.currency}
                    </CardDescription>
                  </div>
                  {getStatusBadge(enrollment.paymentStatus)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}:</span>
                    <span className="font-medium text-[#262626] dark:text-white">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  {enrollment.paymentDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}:</span>
                      <span className="font-medium text-[#262626] dark:text-white">
                        {new Date(enrollment.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
