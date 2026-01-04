'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { CheckCircle2, Send } from 'lucide-react';

interface ContactFormProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function ContactForm({ dictionary }: ContactFormProps) {
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionType: '',
    numberOfAthletes: '',
    contactMethod: '',
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = dictionary.pages.contact.form;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implement actual form submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({
        institutionName: '',
        institutionType: '',
        numberOfAthletes: '',
        contactMethod: '',
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Institution Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="institutionName" className="text-white font-semibold">{form.institutionName}</Label>
        <Input
          id="institutionName"
          type="text"
          placeholder={form.institutionNamePlaceholder}
          value={formData.institutionName}
          onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
          required
        />
      </motion.div>

      {/* Institution Type */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <Label htmlFor="institutionType" className="text-white font-semibold">{form.institutionType}</Label>
        <Select value={formData.institutionType} onValueChange={(value) => setFormData({ ...formData, institutionType: value })}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder={form.institutionTypePlaceholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="academy">{form.typeAcademy}</SelectItem>
            <SelectItem value="school">{form.typeSchool}</SelectItem>
            <SelectItem value="sportsClub">{form.typeSportsClub}</SelectItem>
            <SelectItem value="government">{form.typeGovernment}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Number of Athletes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Label htmlFor="numberOfAthletes" className="text-white font-semibold">{form.numberOfAthletes}</Label>
        <Input
          id="numberOfAthletes"
          type="text"
          placeholder={form.numberOfAthletesPlaceholder}
          value={formData.numberOfAthletes}
          onChange={(e) => setFormData({ ...formData, numberOfAthletes: e.target.value })}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
          required
        />
      </motion.div>

      {/* Contact Method */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        <Label htmlFor="contactMethod" className="text-white font-semibold">{form.contactMethod}</Label>
        <Select value={formData.contactMethod} onValueChange={(value) => setFormData({ ...formData, contactMethod: value })}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder={form.contactMethodPlaceholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="email">{form.methodEmail}</SelectItem>
            <SelectItem value="phone">{form.methodPhone}</SelectItem>
            <SelectItem value="whatsapp">{form.methodWhatsApp}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor="name" className="text-white font-semibold">{form.name}</Label>
        <Input
          id="name"
          type="text"
          placeholder={form.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
          required
        />
      </motion.div>

      {/* Email */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-2"
      >
        <Label htmlFor="email" className="text-white font-semibold">{form.email}</Label>
        <Input
          id="email"
          type="email"
          placeholder={form.emailPlaceholder}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
          required
        />
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <Label htmlFor="phone" className="text-white font-semibold">{form.phone}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={form.phonePlaceholder}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
          dir="ltr"
          style={{ textAlign: 'left' }}
        />
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="space-y-2"
      >
        <Label htmlFor="message" className="text-white font-semibold">{form.message}</Label>
        <textarea
          id="message"
          rows={5}
          className="w-full px-3 py-2 border rounded-md bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
          placeholder={form.messagePlaceholder}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
      </motion.div>

      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-sm leading-relaxed">{form.success}</p>
          </div>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-xl"
        >
          <p className="text-red-300 text-sm">{form.error}</p>
        </motion.div>
      )}

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-blue-500/30" 
          disabled={isSubmitting}
        >
          <span className="flex items-center justify-center gap-2">
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Send className="h-5 w-5" />
              </motion.div>
            ) : (
              <>
                <Send className="h-5 w-5" />
                {form.submit}
              </>
            )}
          </span>
        </Button>
      </motion.div>
    </form>
  );
}
