
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, LogIn, UserPlus, Loader2, AlertCircle, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { roleNavigation } from '@/utils/roleRedirection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="90" fill="url(#paint0_linear_1_2)"/>
    <path d="M100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20Z" stroke="white" strokeWidth="4"/>
    <path d="M130.355 69.6447C149.127 88.4168 149.127 111.583 130.355 130.355C111.583 149.127 88.4168 149.127 69.6447 130.355C50.8726 111.583 50.8726 88.4168 69.6447 69.6447C88.4168 50.8726 111.583 50.8726 130.355 69.6447Z" fill="white"/>
    <path d="M100 35C135.901 35 165 64.0995 165 100C165 135.901 135.901 165 100 165C64.0995 165 35 135.901 35 100C35 64.0995 64.0995 35 100 35Z" stroke="url(#paint1_linear_1_2)" strokeWidth="10"/>
    <path d="M123.536 76.4645C136.728 89.6568 136.728 110.343 123.536 123.536C110.343 136.728 89.6568 136.728 76.4645 123.536C63.2721 110.343 63.2721 89.6568 76.4645 76.4645C89.6568 63.2721 110.343 63.2721 123.536 76.4645Z" fill="url(#paint2_linear_1_2)"/>
    <defs>
    <linearGradient id="paint0_linear_1_2" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse">
    <stop stopColor="#38A169"/>
    <stop offset="1" stopColor="#319795"/>
    </linearGradient>
    <linearGradient id="paint1_linear_1_2" x1="100" y1="30" x2="100" y2="170" gradientUnits="userSpaceOnUse">
    <stop stopColor="#68D391"/>
    <stop offset="1" stopColor="#4FD1C5"/>
    </linearGradient>
    <linearGradient id="paint2_linear_1_2" x1="100" y1="70" x2="100" y2="130" gradientUnits="userSpaceOnUse">
    <stop stopColor="#3B82F6"/>
    <stop offset="1" stopColor="#8B5CF6"/>
    </linearGradient>
    </defs>
  </svg>
);

export default function AuthenticationPage() {
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
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
      
      const role = userCredential.role || 'candidate';

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const dashboardPath = roleNavigation.getDashboardPath(role as any);
        router.push(dashboardPath);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="w-full max-w-4xl lg:grid lg:grid-cols-2 rounded-xl shadow-2xl overflow-hidden border border-border bg-card">
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Image
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80"
            alt="Recruitment illustration for Persona AI"
            width={600}
            height={400}
            className="rounded-lg shadow-xl mb-8"
            data-ai-hint="teamwork meeting recruitment"
          />
          <h1 className="text-3xl font-bold mb-4 text-center">
            Accelerate Your Recruitment with AI
          </h1>
          <p className="text-center text-lg opacity-90">
            Unlock the power of AI with Persona AI to find, assess, and hire top talent faster than ever before.
          </p>
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="text-center mb-8 lg:hidden">
             <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold text-xl mb-4">
                <Logo />
                <span className="text-2xl font-headline font-semibold text-primary group-hover:text-primary/90 transition-colors">
                  Persona AI
                </span>
            </Link>
            <h2 className="text-2xl font-semibold text-foreground">Welcome!</h2>
            <p className="text-muted-foreground">Sign in or create an account to get started.</p>
          </div>

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
                        Enter your credentials to access your Persona AI account.
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
                        Join Persona AI and revolutionize your hiring.
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

           <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link href="#" className="underline hover:text-primary">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
