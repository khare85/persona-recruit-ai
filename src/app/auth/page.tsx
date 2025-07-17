
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
import { ArrowRight, LogIn, UserPlus, Loader2, AlertCircle, Info, User, Mail, Lock, Phone, MapPin, Briefcase, Target, DollarSign } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { roleNavigation } from '@/utils/roleRedirection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const candidateRegistrationSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentTitle: z.string().optional(),
  
  // Job Preferences
  jobTypes: z.array(z.string()).min(1, 'Select at least one job type'),
  remotePreference: z.string().min(1, 'Select your remote work preference'),
  salaryMin: z.number().min(0, 'Minimum salary must be positive'),
  salaryMax: z.number().min(0, 'Maximum salary must be positive'),
  availableFrom: z.string().optional(),
  
  // Terms
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => data.salaryMax >= data.salaryMin, {
  message: "Maximum salary must be greater than minimum salary",
  path: ["salaryMax"]
});

type CandidateRegistrationData = z.infer<typeof candidateRegistrationSchema>;

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];

const remotePreferences = [
  { value: 'remote', label: 'Remote Only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site Only' },
  { value: 'flexible', label: 'Flexible' }
];

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
  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const action = searchParams.get('action');
  const { toast } = useToast();
  
  // Registration form
  const form = useForm<CandidateRegistrationData>({
    resolver: zodResolver(candidateRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      location: '',
      currentTitle: '',
      jobTypes: [],
      remotePreference: '',
      salaryMin: 50000,
      salaryMax: 100000,
      availableFrom: '',
      termsAccepted: false
    }
  });

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
  
  const handleRegistration = async (data: CandidateRegistrationData) => {
    try {
      setIsRegistering(true);
      setRegistrationError(null);
      
      // Step 1: Create Firebase Auth user
      const firebaseUser = await signUp(data.email, data.password, data.firstName, data.lastName, 'candidate');
      
      // Step 2: Wait for token to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Get token and create complete profile
      const token = await firebaseUser.getIdToken();
      
      // Step 4: Set role claim directly (Firebase client SDK)
      await firebaseUser.getIdToken(true); // Force refresh to get latest claims
      
      // Step 5: Create comprehensive candidate profile with all data
      try {
        const profileResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location || '',
            role: 'candidate'
          })
        });

        if (!profileResponse.ok) {
          console.warn('Profile creation failed:', profileResponse.statusText);
        }
      } catch (profileError) {
        console.warn('Profile creation failed:', profileError);
      }
      
      // Step 6: Save complete profile data including job preferences
      try {
        const completeProfileResponse = await fetch('/api/candidates/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || '',
            location: data.location || '',
            currentTitle: data.currentTitle || '',
            jobTypes: data.jobTypes,
            remotePreference: data.remotePreference,
            salaryRange: {
              min: data.salaryMin,
              max: data.salaryMax,
              currency: 'USD'
            },
            availableFrom: data.availableFrom || '',
            profileCompleteness: 50 // Half complete - need resume and video
          })
        });

        if (!completeProfileResponse.ok) {
          console.warn('Complete profile creation failed:', completeProfileResponse.statusText);
        }
      } catch (completeProfileError) {
        console.warn('Complete profile creation failed:', completeProfileError);
      }
      
      toast({
        title: '🎉 Account Created Successfully!',
        description: 'Welcome to PersonaRecruit! Complete your profile to get started.',
        duration: 4000
      });
      
      // Step 7: Redirect to simplified onboarding (just resume and video)
      router.push('/onboarding/candidate?step=resume');

    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setRegistrationError(errorMessage);
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="w-full max-w-6xl lg:grid lg:grid-cols-2 rounded-xl shadow-2xl overflow-hidden border border-border bg-card">
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

        <div className="p-6 sm:p-10 flex flex-col justify-center overflow-y-auto max-h-screen">
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
                      <CardTitle className="text-2xl">Join PersonaRecruit</CardTitle>
                      <CardDescription>
                        Create your account and set up your profile in one step
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-0">
                      {registrationError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {registrationError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegistration)} className="space-y-6">
                          {/* Basic Information Section */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Basic Information
                            </h3>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="John" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Doe" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="john.doe@example.com" className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone Number</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="location"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Location</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input placeholder="City, State/Country" className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name="currentTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Job Title</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="e.g., Software Engineer, Product Manager" className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Password</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input type="password" placeholder="Enter password" className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="confirmPassword"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Confirm Password</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input type="password" placeholder="Confirm password" className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Job Preferences Section */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Job Preferences
                            </h3>
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="jobTypes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Types (Select all that apply)</FormLabel>
                                    <div className="grid grid-cols-2 gap-3">
                                      {jobTypes.map(type => (
                                        <div key={type.value} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={type.value}
                                            checked={field.value.includes(type.value)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([...field.value, type.value]);
                                              } else {
                                                field.onChange(field.value.filter(t => t !== type.value));
                                              }
                                            }}
                                          />
                                          <FormLabel htmlFor={type.value} className="text-sm">{type.label}</FormLabel>
                                        </div>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="remotePreference"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Remote Work Preference</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select your preference" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {remotePreferences.map(pref => (
                                          <SelectItem key={pref.value} value={pref.value}>
                                            {pref.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="salaryMin"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Minimum Salary (USD)</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input 
                                            type="number" 
                                            placeholder="50000" 
                                            className="pl-10" 
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="salaryMax"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Maximum Salary (USD)</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input 
                                            type="number" 
                                            placeholder="100000" 
                                            className="pl-10" 
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name="availableFrom"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Available From (Optional)</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          {/* Terms Section */}
                          <FormField
                            control={form.control}
                            name="termsAccepted"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary hover:underline">
                                      Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                      Privacy Policy
                                    </Link>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between items-center pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setActiveTab("login")}
                            >
                              Already have an account?
                            </Button>
                            
                            <Button 
                              type="submit" 
                              disabled={isRegistering}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {isRegistering ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Creating Account...
                                </>
                              ) : (
                                <>
                                  Create Account & Continue
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                      
                      <div className="text-center text-sm text-muted-foreground">
                        Are you a company?{" "}
                        <Link href="/auth/register/company" className="text-primary hover:underline">
                          Register here
                        </Link>
                      </div>
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
