'use client';

import { useState } from 'react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// Since we can't use async in client components, we'll need to pass dictionary as props
// For now, we'll create a client component that receives the dictionary
export default function ContactPage({ dictionary, locale, user }: { dictionary: any; locale: Locale; user?: { fullName?: string; email: string } | null }) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <Header dictionary={dictionary} locale={locale} user={user} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center">
          <div className="container max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {dictionary.pages.contact.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {dictionary.pages.contact.subtitle}
            </p>
          </div>
        </section>

        {/* Contact Form & Info Section */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {dictionary.pages.contact.form.submit}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name">{dictionary.pages.contact.form.name}</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={dictionary.pages.contact.form.namePlaceholder}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">{dictionary.pages.contact.form.email}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={dictionary.pages.contact.form.emailPlaceholder}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">{dictionary.pages.contact.form.message}</Label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        placeholder={dictionary.pages.contact.form.messagePlaceholder}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="w-full min-h-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800">{dictionary.pages.contact.form.success}</p>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{dictionary.pages.contact.form.error}</p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? dictionary.common.loading : dictionary.pages.contact.form.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {dictionary.pages.contact.info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Mail className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Email</p>
                        <p className="text-gray-600 dark:text-gray-400">contact@dnawebapp.com</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30">
                        <Phone className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                        <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Address</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          123 Tech Street<br />
                          Innovation City, IC 12345
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
                  <CardHeader>
                    <CardTitle className="font-bold text-gray-900 dark:text-gray-100">Office Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <span className="font-medium">Monday - Friday:</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                        <span className="font-medium">Saturday:</span>
                        <span className="text-pink-600 dark:text-pink-400 font-semibold">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <span className="font-medium">Sunday:</span>
                        <span className="text-gray-600 dark:text-gray-400 font-semibold">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}