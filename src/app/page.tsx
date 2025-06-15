
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/shared/Container';
import Image from 'next/image';
import { ArrowRight, BarChart2, Briefcase, Cpu, DollarSign, LogIn, Sparkles, Users, UserPlus, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <Container className="z-10 text-center">
          <Zap className="mx-auto h-16 w-16 text-primary mb-6 animate-bounce" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold tracking-tight text-foreground">
            Revolutionize Your Hiring with <span className="text-primary">Persona Recruit AI</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Accelerate your recruitment process. Our intelligent platform finds, assesses, and helps you hire top talent smarter and faster using the power of AI.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth" passHref>
              <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-primary/30 transition-shadow">
                <UserPlus className="mr-2 h-5 w-5" /> Get Started
              </Button>
            </Link>
            <Link href="/auth" passHref>
              <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-lg hover:shadow-accent/30 transition-shadow">
                <LogIn className="mr-2 h-5 w-5" /> Login / View Demo
              </Button>
            </Link>
          </div>
        </Container>
        <div className="absolute inset-0 z-0 opacity-5">
            <Image 
                src="https://placehold.co/1600x900.png" 
                data-ai-hint="abstract technology recruitment" 
                alt="Abstract technology background for Persona Recruit AI" 
                layout="fill" 
                objectFit="cover" 
                className="blur-md" 
                priority
            />
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 lg:py-24 bg-background">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-semibold text-foreground">Why Persona Recruit AI?</h2>
            <p className="mt-3 text-md text-muted-foreground max-w-xl mx-auto">
              Discover features built to accelerate your talent acquisition with AI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <Cpu className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Our advanced algorithms analyze profiles to find the perfect candidates for your roles, beyond just keywords.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <Sparkles className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Automated Job Descriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Generate compelling and inclusive job descriptions in seconds with our AI assistant.</p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <Users className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Intelligent Video Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gain deeper insights from video interviews with AI-driven behavioral and competency assessments.</p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <Briefcase className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Dedicated Company Portals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Showcase your brand and jobs on a customizable portal, embeddable into your website.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <BarChart2 className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Recruiter & Admin Dashboards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Powerful tools for recruiters and comprehensive oversight for platform administrators.</p>
              </CardContent>
            </Card>
             <Card className="shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4">
                <DollarSign className="h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Referral Program Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Engage your network and reward successful referrals with our integrated system.</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Conceptual Subscription Tiers */}
      <section className="py-16 lg:py-24 bg-muted/40">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-semibold text-foreground">Flexible Plans for Every Need</h2>
            <p className="mt-3 text-md text-muted-foreground max-w-xl mx-auto">
              Choose the plan that best suits your organization's size and recruitment goals with Persona Recruit AI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <Card className="border-border shadow-lg">
              <CardHeader className="items-center text-center">
                <CardTitle className="text-2xl font-semibold">Starter</CardTitle>
                <CardDescription>For small teams & startups</CardDescription>
                <p className="text-4xl font-bold text-primary pt-2">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-center">
                <p>Up to 5 Active Job Postings</p>
                <p>Basic AI Job Descriptions</p>
                <p>Standard Candidate Search</p>
                <Button className="w-full mt-4">Choose Plan</Button>
              </CardContent>
            </Card>
            {/* Tier 2 - Highlighted */}
            <Card className="border-primary shadow-2xl ring-2 ring-primary relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">Popular</div>
              <CardHeader className="items-center text-center pt-8">
                <CardTitle className="text-2xl font-semibold">Professional</CardTitle>
                <CardDescription>For growing businesses</CardDescription>
                 <p className="text-4xl font-bold text-primary pt-2">$149<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-center">
                <p>Up to 20 Active Job Postings</p>
                <p>Advanced AI Job Descriptions</p>
                <p>AI Talent Search (Limited)</p>
                <p>Video Interview Analysis (5/mo)</p>
                <Button className="w-full mt-4">Choose Plan</Button>
              </CardContent>
            </Card>
            {/* Tier 3 */}
            <Card className="border-border shadow-lg">
              <CardHeader className="items-center text-center">
                <CardTitle className="text-2xl font-semibold">Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                 <p className="text-4xl font-bold text-primary pt-2">Custom</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-center">
                <p>Unlimited Job Postings</p>
                <p>Full AI Suite Access</p>
                <p>Dedicated Company Portal & Branding</p>
                <p>Premium Support & Integrations</p>
                <Button className="w-full mt-4">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
      
      {/* About Us Teaser */}
       <section className="py-16 lg:py-24 bg-background">
        <Container className="text-center">
           <Image 
                src="https://placehold.co/150x150.png" 
                data-ai-hint="diverse team working" 
                alt="Persona Recruit AI Team" 
                width={120} 
                height={120} 
                className="rounded-full mx-auto mb-6 shadow-lg"
            />
          <h2 className="text-3xl font-headline font-semibold text-foreground">About Persona Recruit AI</h2>
          <p className="mt-4 text-md text-muted-foreground max-w-2xl mx-auto">
            We are a passionate team of technologists and HR experts dedicated to accelerating recruitment and making it more efficient, effective, and equitable through the power of artificial intelligence. Our mission is to connect great companies with exceptional talent, seamlessly.
          </p>
           <Button variant="link" className="mt-4 text-primary text-lg">
            Learn More About Us <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Container>
      </section>

    </div>
  );
}
