'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { updatePaymentStatusAction } from '@/lib/actions/enrollmentActions';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { User } from '@/lib/db/repositories/userRepository';

interface PaymentReviewClientProps {
  locale: string;
  dict: any;
  enrollment: Enrollment;
  course: Course | null;
  student: User | null;
}

export default function PaymentReviewClient({
  locale,
  dict,
  enrollment,
  course,
  student,
}: PaymentReviewClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    const result = await updatePaymentStatusAction(enrollment.id, 'paid', notes);
    
    if (result.success) {
      alert(locale === 'ar' ? 'تمت الموافقة على الدفع بنجاح' : 'Payment approved successfully');
      router.push(`/${locale}/dashboard/payments`);
      router.refresh();
    } else {
      alert(result.error || (locale === 'ar' ? 'فشل في الموافقة على الدفع' : 'Failed to approve payment'));
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert(locale === 'ar' ? 'يرجى إضافة ملاحظة لسبب الرفض' : 'Please add a note explaining the rejection reason');
      return;
    }

    setProcessing(true);
    const result = await updatePaymentStatusAction(enrollment.id, 'rejected', notes);
    
    if (result.success) {
      alert(locale === 'ar' ? 'تم رفض الدفع' : 'Payment rejected');
      router.push(`/${locale}/dashboard/payments`);
      router.refresh();
    } else {
      alert(result.error || (locale === 'ar' ? 'فشل في رفض الدفع' : 'Failed to reject payment'));
    }
    setProcessing(false);
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/${locale}/dashboard/payments`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {locale === 'ar' ? 'مراجعة الدفع' : 'Review Payment'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' ? 'راجع إثبات الدفع ووافق أو ارفض' : 'Review payment proof and approve or reject'}
          </p>
        </div>
      </div>

      {/* Warning if already processed */}
      {enrollment.paymentStatus === 'paid' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                {locale === 'ar' ? 'تمت الموافقة على هذا الدفع' : 'This payment has been approved'}
              </p>
              <p className="text-sm text-green-800">
                {locale === 'ar' ? 'لا يمكن تعديله' : 'Cannot be modified'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Details */}
        <Card className="border-2">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === 'ar' ? 'الطالب:' : 'Student:'}</span>
                <span className="font-semibold">{student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === 'ar' ? 'الدورة:' : 'Course:'}</span>
                <span className="font-semibold">
                  {locale === 'ar' ? course?.nameAr : course?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === 'ar' ? 'المدة:' : 'Duration:'}</span>
                <span className="font-semibold">{course?.duration} {locale === 'ar' ? 'شهر' : 'months'}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-3 mt-3">
                <span>{locale === 'ar' ? 'المبلغ:' : 'Amount:'}</span>
                <span className="text-primary text-2xl">
                  {course?.price} {course?.currency}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-muted-foreground">{locale === 'ar' ? 'الحالة:' : 'Status:'}</span>
                <Badge className={
                  enrollment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  enrollment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {enrollment.paymentStatus === 'paid' ? (locale === 'ar' ? 'مدفوع' : 'Paid') :
                   enrollment.paymentStatus === 'pending' ? (locale === 'ar' ? 'قيد المراجعة' : 'Pending') :
                   (locale === 'ar' ? 'مرفوض' : 'Rejected')}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{locale === 'ar' ? 'تاريخ التسجيل:' : 'Enrollment Date:'}</span>
                <span>
                  {new Date(enrollment.enrollmentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Proof */}
        <Card className="border-2">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'إثبات الدفع' : 'Payment Proof'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {enrollment.paymentProofUrl ? (
              <div className="bg-gray-100 rounded-lg p-4">
                <img 
                  src={enrollment.paymentProofUrl} 
                  alt="Payment Proof" 
                  className="w-full rounded shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <p>{locale === 'ar' ? 'لم يتم رفع إثبات الدفع' : 'No payment proof uploaded'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      {enrollment.paymentStatus !== 'paid' && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'ملاحظات' : 'Notes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">
                  {locale === 'ar' ? 'أضف ملاحظات (مطلوب عند الرفض)' : 'Add notes (required for rejection)'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب ملاحظاتك هنا...' : 'Write your notes here...'}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/payments`)}
                  disabled={processing}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !enrollment.paymentProofUrl}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  {processing ? (locale === 'ar' ? 'جاري الرفض...' : 'Rejecting...') : (locale === 'ar' ? 'رفض' : 'Reject')}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing || !enrollment.paymentProofUrl}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Check className="w-4 h-4" />
                  {processing ? (locale === 'ar' ? 'جاري الموافقة...' : 'Approving...') : (locale === 'ar' ? 'موافقة' : 'Approve')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
