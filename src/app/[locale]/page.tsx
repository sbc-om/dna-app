import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header dictionary={dictionary} locale={locale} />
      
      <main className="flex-1 bg-gradient-to-br from-[#F2574C]/10 via-[#30B2D2]/10 to-[#E8A12D]/10 overflow-y-auto pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="w-full h-full flex items-center justify-center px-4 text-center">
          <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 py-8">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <img 
                src="/logo.png" 
                alt={dictionary.pages.home.hero.title}
                className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl"
              />
            </div>
            
            {/* Title */}
            {/* <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-[#F2574C] via-[#30B2D2] to-[#E8A12D] bg-clip-text text-transparent">
              {dictionary.pages.home.hero.title}
            </h1> */}
            
            {/* Slogan */}
            <p className="text-2xl md:text-4xl text-muted-foreground font-bold">
              {dictionary.pages.home.hero.subtitle}
            </p>
            
            {/* Desktop Buttons */}
            <div className="hidden md:flex flex-row gap-4 md:gap-6 justify-center items-center pt-8 flex-wrap">
              <Link href={`/${locale}/book-appointment`}>
                <Button size="lg" className="bg-[#F2574C] hover:bg-[#F2574C]/90 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all">
                  {dictionary.pages.home.hero.cta}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/login`}>
                <Button size="lg" variant="outline" className="border-2 border-[#30B2D2] text-[#30B2D2] hover:bg-[#30B2D2]/10 px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all">
                  {dictionary.pages.home.hero.loginCta}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t shadow-lg z-50">
        <div className="flex gap-3 p-4">
          <Link href={`/${locale}/book-appointment`} className="flex-1">
            <Button size="lg" className="w-full bg-[#F2574C] hover:bg-[#F2574C]/90 text-white py-5 text-sm rounded-lg shadow-lg">
              {dictionary.pages.home.hero.cta}
            </Button>
          </Link>
          <Link href={`/${locale}/auth/login`} className="flex-1">
            <Button size="lg" className="w-full bg-[#30B2D2] hover:bg-[#30B2D2]/90 text-white py-5 text-sm rounded-lg shadow-lg">
              {dictionary.pages.home.hero.loginCta}
            </Button>
          </Link>
        </div>
      </div>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
