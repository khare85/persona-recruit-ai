'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  companyId: string;
  status: string;
}

function QuickApplyContent() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);

  const jobId = params.id as string;

  useEffect(() => {
    async function fetchJob() {
      if (!jobId) return;

      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data.data);
      } catch (error) {
        console.error('Error fetching job:', error);
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive"
        });
        router.push('/careers');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJob();
  }, [jobId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;
    
    if (coverNote.trim().length < 50) {
      toast({
        title: "Cover Note Required",
        description: "Please write at least 50 characters about why you're interested in this role.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to apply for jobs",
          variant: "destructive"
        });
        router.push('/auth');
        return;
      }

      const response = await fetch(`/api/jobs/${jobId}/quick-apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverNote: coverNote.trim(),
          willingToRelocate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      toast({
        title: "Application Submitted!",
        description: data.message || `Your application for ${job.title} has been submitted successfully.`
      });

      router.push('/candidates/my-applications');

    } catch (error: any) {
      console.error('Application error:', error);
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <Link href="/careers">
            <Button variant="outline">Back to Careers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/careers">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Apply to {job.title}</h1>
          <p className="text-gray-600 mt-2">{job.department} • {job.location}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Apply</CardTitle>
                <CardDescription>
                  Submit your application with a cover note. Your profile and video introduction will be automatically included.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="coverNote">
                      Cover Note <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="coverNote"
                      placeholder="Tell us why you're interested in this role and why you'd be a great fit... (minimum 50 characters)"
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      rows={6}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {coverNote.length}/500 characters (minimum 50 required)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="relocate"
                      checked={willingToRelocate}
                      onCheckedChange={(checked) => setWillingToRelocate(checked as boolean)}
                    />
                    <Label htmlFor="relocate" className="text-sm">
                      I am willing to relocate for this position
                    </Label>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Your complete profile, resume, and video introduction will be automatically included with this application.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || coverNote.trim().length < 50}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{job.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickApplyPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <QuickApplyContent />
    </ProtectedRoute>
  );
}