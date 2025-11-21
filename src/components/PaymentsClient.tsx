'use client';

import { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock, DollarSign, Calendar, User as UserIcon, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getMyEnrollmentsAction, getAllEnrollmentsAction } from '@/lib/actions/enrollmentActions';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load enrollments
    const enrollmentsResult = currentUser.role === 'admin' 
      ? await getAllEnrollmentsAction()
      : await getMyEnrollmentsAction();
    if (enrollmentsResult.success && enrollmentsResult.enrollments) {
      setEnrollments(enrollmentsResult.enrollments);
    }
    
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-4 h-4 mr-1" />
            {locale === 'ar' ? 'مدفوع' : 'Paid'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-4 h-4 mr-1" />
            {locale === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-4 h-4 mr-1" />
            {locale === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-6">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  // Admin View
  if (currentUser.role === 'admin') {
    const pendingEnrollments = enrollments.filter(e => e.paymentStatus === 'pending' && e.paymentProofUrl);
    const paidEnrollments = enrollments.filter(e => e.paymentStatus === 'paid');
    const unpaidEnrollments = enrollments.filter(e => e.paymentStatus === 'pending' && !e.paymentProofUrl);

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {locale === 'ar' ? 'إدارة المدفوعات' : 'Payment Management'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' ? 'مراجعة وإدارة مدفوعات الطلاب' : 'Review and manage student payments'}
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              {locale === 'ar' ? 'قيد المراجعة' : 'Pending Review'} ({pendingEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              <CheckCircle className="w-4 h-4 mr-2" />
              {locale === 'ar' ? 'مدفوع' : 'Paid'} ({paidEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="unpaid">
              <XCircle className="w-4 h-4 mr-2" />
              {locale === 'ar' ? 'غير مدفوع' : 'Unpaid'} ({unpaidEnrollments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingEnrollments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد مدفوعات قيد المراجعة' : 'No pending payments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-yellow-200">
                    <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 mt-2">
                              <UserIcon className="w-4 h-4" />
                              {enrollment.student?.fullName}
                            </div>
                          </CardDescription>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                          <span className="font-semibold">{enrollment.course?.price} {enrollment.course?.currency}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}</span>
                          <span className="font-semibold">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                      </div>
                      
                      {enrollment.paymentProofUrl && (
                        <div className="border rounded-lg p-2">
                          <img 
                            src={enrollment.paymentProofUrl} 
                            alt="Payment Proof" 
                            className="w-full h-40 object-contain rounded"
                          />
                        </div>
                      )}

                      <Button 
                        onClick={() => window.location.href = `/${locale}/dashboard/payments/review/${enrollment.id}`}
                        className="w-full bg-[#30B2D2] hover:bg-[#1E3A8A]"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {locale === 'ar' ? 'مراجعة والموافقة' : 'Review & Approve'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {paidEnrollments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد مدفوعات مكتملة' : 'No completed payments'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paidEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden border-green-200">
                    <CardHeader className="bg-green-50 dark:bg-green-950">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 mt-2">
                              <UserIcon className="w-4 h-4" />
                              {enrollment.student?.fullName}
                            </div>
                          </CardDescription>
                        </div>
                        {getStatusBadge(enrollment.paymentStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
                        <span className="font-semibold">{enrollment.course?.price} {enrollment.course?.currency}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</span>
                        <span className="font-semibold">
                          {enrollment.paymentDate ? new Date(enrollment.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unpaid" className="space-y-4">
            {unpaidEnrollments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {locale === 'ar' ? 'جميع الطلاب دفعوا' : 'All students have paid'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unpaidEnrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 dark:bg-gray-950">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 mt-2">
                              <UserIcon className="w-4 h-4" />
                              {enrollment.student?.fullName}
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}</span>
                        <span className="font-semibold">{enrollment.course?.price} {enrollment.course?.currency}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}</span>
                        <span className="font-semibold">
                          {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        {locale === 'ar' ? 'في انتظار رفع إثبات الدفع من ولي الأمر' : 'Waiting for parent to upload payment proof'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    );
  }

  // Parent View
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {locale === 'ar' ? 'المدفوعات' : 'Payments'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar' ? 'إدارة مدفوعات الدورات التدريبية' : 'Manage course payments'}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'لا توجد تسجيلات' : 'No enrollments found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden">
              <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2 mt-2">
                        <UserIcon className="w-4 h-4" />
                        {enrollment.student?.fullName}
                      </div>
                    </CardDescription>
                  </div>
                  {getStatusBadge(enrollment.paymentStatus)}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {locale === 'ar' ? 'السعر' : 'Price'}
                    </span>
                    <span className="font-semibold">
                      {enrollment.course?.price} {enrollment.course?.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {locale === 'ar' ? 'المدة' : 'Duration'}
                    </span>
                    <span className="font-semibold">
                      {enrollment.course?.duration} {locale === 'ar' ? 'شهر' : 'months'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {locale === 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date'}
                    </span>
                    <span className="font-semibold">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                </div>

                {enrollment.paymentStatus === 'pending' && enrollment.paymentProofUrl && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      {locale === 'ar' ? 'تم رفع إثبات الدفع وهو قيد المراجعة' : 'Payment proof uploaded and under review'}
                    </p>
                  </div>
                )}

                {enrollment.paymentStatus === 'rejected' && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm">
                    <p className="text-red-800 dark:text-red-200">
                      {locale === 'ar' ? 'تم رفض إثبات الدفع. يرجى رفع إثبات جديد' : 'Payment proof rejected. Please upload a new proof'}
                    </p>
                    {enrollment.notes && (
                      <p className="mt-1 text-red-700 dark:text-red-300">
                        {locale === 'ar' ? 'ملاحظة: ' : 'Note: '}{enrollment.notes}
                      </p>
                    )}
                  </div>
                )}

                {(enrollment.paymentStatus === 'pending' && !enrollment.paymentProofUrl) || enrollment.paymentStatus === 'rejected' ? (
                  <Button 
                    onClick={() => window.location.href = `/${locale}/dashboard/payments/${enrollment.id}`}
                    className="w-full"
                    variant="default"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {locale === 'ar' ? 'رفع إثبات الدفع' : 'Upload Payment Proof'}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
