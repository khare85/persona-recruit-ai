
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, LogIn, UserPlus, PlayCircle, Users, Building, LayoutDashboard, ShieldCheck, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert

export default function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would handle actual form submissions
    // For now, redirecting to jobs page as a generic post-login landing.
    // A real app would check user role and redirect accordingly.
    router.push('/jobs');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would handle actual form submissions
    // Simulate sign up and redirect (conceptual)
    router.push('/jobs'); // Or a welcome/onboarding page
  };

  const handlePersonaSelection = (personaPath: string) => {
    router.push(personaPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="w-full max-w-4xl lg:grid lg:grid-cols-2 rounded-xl shadow-2xl overflow-hidden border border-border bg-card">
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Image
            src="https://placehold.co/600x400.png"
            alt="Recruitment illustration for Persona Recruit AI"
            width={400}
            height={300}
            className="rounded-lg shadow-xl mb-8"
            data-ai-hint="teamwork meeting recruitment"
          />
          <h1 className="text-3xl font-bold mb-4 text-center">
            Accelerate Your Recruitment with AI
          </h1>
          <p className="text-center text-lg opacity-90">
            Unlock the power of AI with Persona Recruit AI to find, assess, and hire top talent faster than ever before.
          </p>
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="text-center mb-8 lg:hidden">
             <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold text-xl mb-4">
                <UserPlus className="h-7 w-7" />
                <span>Persona Recruit AI</span>
            </Link>
            <h2 className="text-2xl font-semibold text-foreground">Welcome!</h2>
            <p className="text-muted-foreground">Sign in, create an account, or explore our demo.</p>
          </div>

          {!showPersonaSelector ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="text-center px-0">
                      <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                      <CardDescription>
                        Enter your credentials to access your Persona Recruit AI account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input id="login-email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <Link
                              href="#"
                              className="text-xs text-primary hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <Input id="login-password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" size="lg">
                          <LogIn className="mr-2 h-5 w-5" /> Login
                        </Button>
                      </form>
                      <p className="text-center text-sm text-muted-foreground">
                        No account?{" "}
                        <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("signup")}>
                          Sign up here
                        </Button>
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="signup">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="text-center px-0">
                      <CardTitle className="text-2xl">Create an Account</CardTitle>
                      <CardDescription>
                        Join Persona Recruit AI and revolutionize your hiring.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input id="signup-name" placeholder="Your Name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input id="signup-email" type="email" placeholder="you@example.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input id="signup-password" type="password" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                          <Input id="signup-confirm-password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" size="lg">
                          <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                        </Button>
                      </form>
                      <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>
                          Login here
                        </Button>
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Or explore the platform with sample data:</p>
                <Button variant="secondary" className="w-full" onClick={() => setShowPersonaSelector(true)}>
                    <PlayCircle className="mr-2 h-5 w-5" /> Explore Demo Personas
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-0 shadow-none">
              <CardHeader className="text-center px-0">
                <CardTitle className="text-2xl">Explore Persona Recruit AI</CardTitle>
                <CardDescription>
                  Select a persona to see how our platform accelerates recruitment for different roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-0">
                 <Alert variant="default" className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Demo Mode</AlertTitle>
                  <AlertDescription>
                    You are about to enter a demonstration environment. No actual user account will be created.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => handlePersonaSelection('/candidates/dashboard')} className="w-full justify-start" variant="outline" size="lg">
                  <Users className="mr-3 h-5 w-5 text-primary" /> View as Candidate
                </Button>
                <Button onClick={() => handlePersonaSelection('/recruiter/dashboard')} className="w-full justify-start" variant="outline" size="lg">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-primary" /> View as Recruiter
                </Button>
                <Button onClick={() => handlePersonaSelection('/company/dashboard')} className="w-full justify-start" variant="outline" size="lg">
                  <Building className="mr-3 h-5 w-5 text-primary" /> View as Company Admin
                </Button>
                <Button onClick={() => handlePersonaSelection('/admin/dashboard')} className="w-full justify-start" variant="outline" size="lg">
                  <ShieldCheck className="mr-3 h-5 w-5 text-primary" /> View as Super Admin
                </Button>
              </CardContent>
              <CardFooter className="flex-col items-center px-0">
                 <Button variant="link" onClick={() => setShowPersonaSelector(false)} className="mt-4">
                    Back to Login/Sign Up
                </Button>
              </CardFooter>
            </Card>
          )}

           <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link href="#" className="underline hover:text-primary">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
