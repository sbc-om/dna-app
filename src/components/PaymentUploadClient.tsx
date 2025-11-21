'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, XCircle, Receipt, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { uploadPaymentProofAction } from '@/lib/actions/enrollmentActions';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { AdminSettings } from '@/lib/db/repositories/adminSettingsRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { User } from '@/lib/db/repositories/userRepository';
import { ImageUpload } from './ImageUpload';

interface PaymentUploadClientProps {
  locale: string;
  dict: any;
  enrollment: Enrollment;
  course: Course | null;
  student: User | null;
  adminSettings: AdminSettings | null;
}

export default function PaymentUploadClient({
  locale,
  dict,
  enrollment,
  course,
  student,
  adminSettings,
}: PaymentUploadClientProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    setUploading(true);
    try {
      const result = await uploadPaymentProofAction(enrollment.id, croppedImageUrl);
      
      if (result.success) {
        alert(locale === 'ar' ? 'تم رفع إثبات الدفع بنجاح. في انتظار مراجعة المسؤول.' : 'Payment proof uploaded successfully. Waiting for admin review.');
        router.push(`/${locale}/dashboard/payments`);
        router.refresh();
      } else {
        alert(result.error || (locale === 'ar' ? 'فشل في رفع إثبات الدفع' : 'Failed to upload payment proof'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء رفع الملف' : 'An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
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
            {locale === 'ar' ? 'رفع إثبات الدفع' : 'Upload Payment Proof'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' 
              ? 'قم بتحويل المبلغ إلى الحساب أدناه ثم ارفع صورة إثبات الدفع' 
              : 'Transfer the amount to the account below and upload the payment proof'}
          </p>
        </div>
      </div>

      {/* Current Status */}
      {enrollment.paymentStatus === 'pending' && enrollment.paymentProofUrl && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">
                {locale === 'ar' ? 'تم رفع إثبات الدفع' : 'Payment Proof Uploaded'}
              </p>
              <p className="text-sm text-yellow-800">
                {locale === 'ar' ? 'في انتظار مراجعة المسؤول' : 'Waiting for admin review'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {enrollment.paymentStatus === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">
                {locale === 'ar' ? 'تم رفض إثبات الدفع' : 'Payment Proof Rejected'}
              </p>
              <p className="text-sm text-red-800">
                {locale === 'ar' ? 'يرجى رفع إثبات دفع جديد' : 'Please upload a new payment proof'}
              </p>
              {enrollment.notes && (
                <p className="text-sm text-red-700 mt-1">
                  {locale === 'ar' ? 'ملاحظة: ' : 'Note: '}{enrollment.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bank Account Information */}
        {adminSettings && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                {locale === 'ar' ? 'معلومات الحساب البنكي' : 'Bank Account Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {adminSettings.fullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'الاسم:' : 'Name:'}</span>
                  <span className="font-semibold">{adminSettings.fullName}</span>
                </div>
              )}
              {adminSettings.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                  <span className="font-mono font-semibold" dir="ltr">{adminSettings.phoneNumber}</span>
                </div>
              )}
              {adminSettings.bankName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'البنك:' : 'Bank:'}</span>
                  <span className="font-semibold">{adminSettings.bankName}</span>
                </div>
              )}
              {adminSettings.bankAccountNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'رقم الحساب:' : 'Account Number:'}</span>
                  <span className="font-mono font-semibold" dir="ltr">{adminSettings.bankAccountNumber}</span>
                </div>
              )}
              {adminSettings.bankAccountHolder && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'اسم الحساب:' : 'Account Holder:'}</span>
                  <span className="font-semibold">{adminSettings.bankAccountHolder}</span>
                </div>
              )}
              {adminSettings.iban && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN:</span>
                    <span className="font-mono text-sm font-semibold" dir="ltr">{adminSettings.iban}</span>
                  </div>
                </div>
              )}
              {adminSettings.swiftCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Swift Code:</span>
                  <span className="font-mono font-semibold" dir="ltr">{adminSettings.swiftCode}</span>
                </div>
              )}
              {(locale === 'ar' ? adminSettings.paymentInstructionsAr : adminSettings.paymentInstructions) && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {locale === 'ar' ? adminSettings.paymentInstructionsAr : adminSettings.paymentInstructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Details */}
        <Card className="border-2 border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'الدورة:' : 'Course:'}</span>
              <span className="font-semibold">
                {locale === 'ar' ? course?.nameAr : course?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'الطالب:' : 'Student:'}</span>
              <span className="font-semibold">{student?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'المدة:' : 'Duration:'}</span>
              <span className="font-semibold">{course?.duration} {locale === 'ar' ? 'شهر' : 'months'}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-3 mt-3">
              <span>{locale === 'ar' ? 'المبلغ المطلوب:' : 'Amount Due:'}</span>
              <span className="text-primary text-2xl">
                {course?.price} {course?.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
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
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      {enrollment.paymentStatus !== 'paid' && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Icon Section */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-green-100 border-4 border-white flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {locale === 'ar' ? 'رفع إثبات الدفع' : 'Upload Payment Proof'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {locale === 'ar' 
                    ? 'قم برفع صورة واضحة لإثبات التحويل البنكي' 
                    : 'Upload a clear image of your bank transfer receipt'}
                </p>
              </div>

              {/* Upload Component */}
              <div className="w-full flex justify-center">
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={enrollment.paymentProofUrl}
                  aspectRatio={undefined}
                  maxSizeMB={5}
                  shape="square"
                  icon={<FileText className="w-20 h-20 text-blue-400" />}
                />
              </div>

              {/* File Requirements */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>{locale === 'ar' ? 'صيغ مقبولة: JPG, PNG' : 'Accepted formats: JPG, PNG'}</p>
                <p>{locale === 'ar' ? 'الحجم الأقصى: 5 MB' : 'Max size: 5 MB'}</p>
              </div>
              
              {uploading && (
                <div className="text-center text-sm text-blue-600 font-medium">
                  {locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {enrollment.paymentStatus === 'paid' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">
              {locale === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Completed!'}
            </h3>
            <p className="text-green-800">
              {locale === 'ar' ? 'تم التأكد من دفعك وتفعيل الدورة' : 'Your payment has been verified and the course is activated'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
