"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  ArrowRight,
  AlertCircle,
  Phone,
  MapPin,
  Briefcase,
  Target,
  DollarSign
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

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

export default function CandidateRegistrationPage() {
  const { signUp, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

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

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join PersonaRecruit</CardTitle>
          <CardDescription>
            Create your account and set up your profile in one simple step
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {registrationError && (
            <Alert variant="destructive" className="mb-6">
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
                <Link 
                  href="/auth" 
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Already have an account? Sign in
                </Link>
                
                <Button 
                  type="submit" 
                  disabled={isRegistering}
                  className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
        </CardContent>
      </Card>
    </div>
  );
}