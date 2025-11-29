'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AtSign, Mail, Phone, Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';

interface RegisterFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function RegisterForm({ dictionary, locale }: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Implement actual registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to login or dashboard
      router.push(`/${locale}/auth/login`);
    } catch (err) {
      setError(dictionary.errors.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#FF5F02]" />
          {dictionary.common.fullName}
        </Label>
        <div className="relative">
          <Input
            id="fullName"
            type="text"
            placeholder={dictionary.auth.fullNamePlaceholder}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="h-12 text-base rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] focus:ring-2 focus:ring-[#FF5F02] pl-11 font-medium transition-all"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF5F02]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
          <AtSign className="w-5 h-5 text-[#FF5F02]" />
          {dictionary.common.username}
        </Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder={dictionary.auth.usernamePlaceholder}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="h-12 text-base rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] focus:ring-2 focus:ring-[#FF5F02] pl-11 font-medium transition-all"
          />
          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF5F02]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#FF5F02]" />
          {dictionary.common.email}
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder={dictionary.auth.emailPlaceholder}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-12 text-base rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] focus:ring-2 focus:ring-[#FF5F02] pl-11 font-medium transition-all"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF5F02]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#FF5F02]" />
          {dictionary.common.phoneNumber}
        </Label>
        <div className="relative">
          <Input
            id="phoneNumber"
            type="tel"
            placeholder={dictionary.auth.phoneNumberPlaceholder}
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="h-12 text-base rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] focus:ring-2 focus:ring-[#FF5F02] pl-11 font-medium transition-all"
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF5F02]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-bold text-[#262626] dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#FF5F02]" />
          {dictionary.common.password}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            placeholder={dictionary.auth.passwordPlaceholder}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="h-12 text-base rounded-2xl border-2 border-[#DDDDDD] dark:border-[#262626] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] focus:ring-2 focus:ring-[#FF5F02] pl-11 font-medium transition-all"
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF5F02]" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border-3 border-red-300 dark:border-red-700 rounded-2xl animate-shake">
          <p className="text-red-800 dark:text-red-200 text-sm font-bold text-center">😞 {error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-14 text-lg font-black rounded-2xl bg-[#FF5F02] hover:bg-[#262626] shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-white" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            {dictionary.common.loading}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            {dictionary.auth.signupButton}
          </span>
        )}
      </Button>
    </form>
  );
}
