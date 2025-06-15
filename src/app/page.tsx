
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, Zap, Search, FileText, Video } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Image from 'next/image';

export default function HomePage() {
  const features = [
    {
      icon: Search,
      title: 'Find Top Talent',
      description: 'Access a diverse pool of candidates with AI-matched skills and experience.',
      href: '/candidates',
      cta: 'Browse Candidates',
    },
    {
      icon: Briefcase,
      title: 'Post Your Vacancies',
      description: 'Generate compelling job descriptions with AI and reach qualified applicants.',
      href: '/jobs/new',
      cta: 'Post a Job',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Leverage AI for resume parsing, interview analysis, and job recommendations.',
      href: '/interviews',
      cta: 'Explore AI Tools',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Container className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold tracking-tight text-foreground">
              Welcome to <span className="text-primary">AI Talent Stream</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Revolutionizing recruitment with intelligent automation. Discover, assess, and hire the best talent faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/jobs" passHref>
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Open Positions
                  <Briefcase className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/candidates/new" passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Join as a Candidate
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-64 md:h-96 lg:h-[450px] rounded-xl overflow-hidden shadow-2xl group">
            <Image 
              src="https://placehold.co/600x450.png" 
              alt="AI powered recruitment" 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint="team collaboration"
              className="transform group-hover:scale-105 transition-transform duration-500 ease-out"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
             <div className="absolute bottom-6 left-6 text-white p-4">
                <h3 className="text-2xl font-semibold drop-shadow-md">Intelligent Hiring Starts Here</h3>
                <p className="text-sm drop-shadow-sm">AI-driven tools for modern recruitment.</p>
             </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground">
              Why Choose AI Talent Stream?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines advanced AI with user-friendly tools to streamline your hiring process and connect you with exceptional talent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300 bg-card hover:bg-muted/30">
                <CardHeader className="items-center text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block ring-4 ring-primary/20">
                    <feature.icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow text-center">
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
                <div className="p-6 pt-0 mt-auto text-center">
                  <Link href={feature.href} passHref>
                    <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-semibold">
                      {feature.cta} &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 md:py-24 bg-muted/40">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground">
              Streamlined Hiring Process
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to finding your next great hire or dream job.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: 'Upload Resume / Post Job', description: 'Candidates upload profiles, recruiters post vacancies effortlessly.' },
              { icon: Zap, title: 'AI Analysis & Matching', description: 'Our AI parses resumes, matches skills, and recommends ideal fits.' },
              { icon: Video, title: 'AI Video Interviews', description: 'Conduct or participate in AI-assisted video interviews for deeper insights.' },
              { icon: Users, title: 'Hire & Onboard', description: 'Make informed decisions and onboard new talent seamlessly.' },
            ].map((step, index) => (
              <Card key={step.title} className="text-center hover:shadow-lg transition-shadow duration-300 bg-card transform hover:-translate-y-1">
                <CardHeader>
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mb-4 border-2 border-accent/50">
                    <step.icon className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="font-headline text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-16 md:py-24">
        <Container className="text-center">
          <h2 className="text-3xl sm:text-4xl font-headline font-semibold text-foreground">
            Ready to Transform Your Talent Strategy?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join AI Talent Stream today and experience the future of recruitment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/jobs/new" passHref>
              <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                Recruiters: Get Started
              </Button>
            </Link>
            <Link href="/candidates/new" passHref>
              <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                Candidates: Find Your Fit
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
