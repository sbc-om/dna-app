import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, UserCircle, BarChart3, Gift, Target, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const dictionary = await getDictionary(locale);
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Header dictionary={dictionary} locale={locale} user={user} />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-[#F2574C]/10 via-[#30B2D2]/10 to-[#E8A12D]/10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#F2574C] via-[#30B2D2] to-[#E8A12D] bg-clip-text text-transparent">
              {dictionary.pages.about.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {dictionary.pages.about.subtitle}
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2574C]/10 text-[#F2574C] font-semibold mb-6">
                  <Sparkles className="w-5 h-5" />
                  <span>{dictionary.pages.about.mission.title}</span>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {dictionary.pages.about.mission.description}
                </p>
              </div>
              <div className="relative h-64 md:h-96 bg-gradient-to-br from-[#F2574C]/20 via-[#30B2D2]/20 to-[#E8A12D]/20 rounded-2xl flex items-center justify-center">
                <Target className="w-32 h-32 text-[#30B2D2]" />
              </div>
            </div>
          </div>
        </section>

        {/* Educational System Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-[#30B2D2]/5 to-[#E8A12D]/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {dictionary.pages.about.system.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Four pillars of our innovative approach to fitness education
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gamification */}
              <Card className="border-2 border-[#F2574C] bg-gradient-to-br from-[#F2574C]/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-xl bg-[#F2574C]/10">
                      <Gamepad2 className="w-10 h-10 text-[#F2574C]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-3 text-[#F2574C]">
                        {dictionary.pages.about.system.gamification.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-foreground/70">
                        {dictionary.pages.about.system.gamification.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Athletic Profile */}
              <Card className="border-2 border-[#30B2D2] bg-gradient-to-br from-[#30B2D2]/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-xl bg-[#30B2D2]/10">
                      <UserCircle className="w-10 h-10 text-[#30B2D2]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-3 text-[#30B2D2]">
                        {dictionary.pages.about.system.athleticProfile.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-foreground/70">
                        {dictionary.pages.about.system.athleticProfile.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Progress Tracking */}
              <Card className="border-2 border-[#E8A12D] bg-gradient-to-br from-[#E8A12D]/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-xl bg-[#E8A12D]/10">
                      <BarChart3 className="w-10 h-10 text-[#E8A12D]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-3 text-[#E8A12D]">
                        {dictionary.pages.about.system.progressTracking.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-foreground/70">
                        {dictionary.pages.about.system.progressTracking.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Reward System */}
              <Card className="border-2 border-[#F2574C] bg-gradient-to-br from-[#F2574C]/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-xl bg-[#F2574C]/10">
                      <Gift className="w-10 h-10 text-[#F2574C]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-3 text-[#F2574C]">
                        {dictionary.pages.about.system.rewardSystem.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-foreground/70">
                        {dictionary.pages.about.system.rewardSystem.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Approach Section */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 border-[#30B2D2] bg-gradient-to-br from-[#30B2D2]/10 to-[#E8A12D]/10">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-[#30B2D2] to-[#E8A12D] bg-clip-text text-transparent">
                  {dictionary.pages.about.approach.title}
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed text-foreground/80">
                  {dictionary.pages.about.approach.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-[#F2574C] via-[#30B2D2] to-[#E8A12D]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
              <div>
                <div className="text-5xl md:text-6xl font-bold mb-2">60</div>
                <div className="text-xl opacity-90">Participants per Session</div>
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-bold mb-2">3</div>
                <div className="text-xl opacity-90">Teams per Academy</div>
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-bold mb-2">100%</div>
                <div className="text-xl opacity-90">Fun & Engagement</div>
              </div>
            </div>
          </div>
        </section>
 
      </main>

      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
