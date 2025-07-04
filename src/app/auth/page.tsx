
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, LogIn, UserPlus, PlayCircle, Users, Building, LayoutDashboard, ShieldCheck, Info, Loader2, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuthenticationPage() {
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const action = searchParams.get('action');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCredential = await signIn(email, password);
      setSuccess('Login successful! Redirecting...');
      
      const user = userCredential; // The user object from firebase
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role || 'candidate';

      // Check if there's a redirect URL
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Redirect based on user role
        if (role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (role === 'company_admin') {
          router.push('/company/dashboard');
        } else if (role === 'recruiter') {
          router.push('/recruiter/dashboard');
        } else if (role === 'interviewer') {
          router.push('/interviewer/dashboard');
        } else {
          router.push('/candidates/dashboard');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
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
            alt="Recruitment illustration for AI Talent Stream"
            width={400}
            height={300}
            className="rounded-lg shadow-xl mb-8"
            data-ai-hint="teamwork meeting recruitment"
          />
          <h1 className="text-3xl font-bold mb-4 text-center">
            Accelerate Your Recruitment with AI
          </h1>
          <p className="text-center text-lg opacity-90">
            Unlock the power of AI with AI Talent Stream to find, assess, and hire top talent faster than ever before.
          </p>
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="text-center mb-8 lg:hidden">
             <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold text-xl mb-4">
                <UserPlus className="h-7 w-7" />
                <span>AI Talent Stream</span>
            </Link>
            <h2 className="text-2xl font-semibold text-foreground">Welcome!</h2>
            <p className="text-muted-foreground">Sign in, create an account, or explore our demo.</p>
          </div>

          {!showPersonaSelector ? (
            <>
              {action === 'apply' && redirectUrl && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Sign in to Apply</AlertTitle>
                  <AlertDescription>
                    Please sign in or create an account to apply for this job.
                  </AlertDescription>
                </Alert>
              )}
              
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
                        Enter your credentials to access your AI Talent Stream account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      {success && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                          <AlertDescription>{success}</AlertDescription>
                        </Alert>
                      )}
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input 
                            id="login-email" 
                            name="email"
                            type="email" 
                            placeholder="admin@talentai.com" 
                            required 
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <Link
                              href="/auth/forgot-password"
                              className="text-xs text-primary hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <Input 
                            id="login-password" 
                            name="password"
                            type="password" 
                            placeholder="admin123"
                            required 
                            disabled={isLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <LogIn className="mr-2 h-5 w-5" />
                          )}
                          {isLoading ? 'Signing in...' : 'Login'}
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
                        Join AI Talent Stream and revolutionize your hiring.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      <Link href={`/auth/register/candidate${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}>
                        <Button className="w-full" size="lg">
                          <UserPlus className="mr-2 h-5 w-5" />
                          Sign Up as a Candidate
                        </Button>
                      </Link>
                      <div className="text-center text-sm text-muted-foreground">
                        Are you a company?{" "}
                        <Link href="/auth/register/company" className="text-primary hover:underline">
                          Register here
                        </Link>
                      </div>
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
                <CardTitle className="text-2xl">Explore AI Talent Stream</CardTitle>
                <CardDescription>
                  Select a persona to see how our platform accelerates recruitment for different roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-0">
                 <Alert variant="default" className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Choose Your Role</AlertTitle>
                  <AlertDescription>
                    Candidates must create an account with a video introduction. Other roles enter demo mode.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/auth/register/candidate')} className="w-full justify-start" variant="outline" size="lg">
                  <Users className="mr-3 h-5 w-5 text-primary" /> Sign up as Candidate
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
