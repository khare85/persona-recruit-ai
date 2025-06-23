"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin
} from 'lucide-react';

interface QuickApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  className?: string;
}

interface QuickApplyData {
  coverNote?: string;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  availableFrom?: string;
  willingToRelocate?: boolean;
}

export function QuickApplyButton({ jobId, jobTitle, companyName, className }: QuickApplyButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [formData, setFormData] = useState<QuickApplyData>({
    coverNote: '',
    willingToRelocate: false
  });

  const checkEligibility = async () => {
    try {
      setIsChecking(true);
      const response = await fetch(`/api/jobs/${jobId}/quick-apply`);
      
      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      const result = await response.json();
      setEligibility(result.data);

      if (result.data.eligible) {
        setIsDialogOpen(true);
      } else {
        // Handle ineligible cases
        if (!result.data.reasons.hasVideoIntro) {
          toast({
            title: "Video Introduction Required",
            description: "Please complete your video introduction to use Quick Apply.",
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/candidates/onboarding/video-intro')}
              >
                Record Video
              </Button>
            )
          });
        } else if (!result.data.reasons.profileComplete) {
          toast({
            title: "Complete Your Profile",
            description: "Please complete your profile before applying to jobs.",
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/candidates/profile')}
              >
                Complete Profile
              </Button>
            )
          });
        } else if (result.data.reasons.alreadyApplied) {
          toast({
            title: "Already Applied",
            description: "You have already applied to this job.",
            variant: "default"
          });
        } else {
          toast({
            title: "Quick Apply Unavailable",
            description: "Quick Apply is not available for this job.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check eligibility. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleQuickApply = async () => {
    try {
      setIsApplying(true);

      const response = await fetch(`/api/jobs/${jobId}/quick-apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Application failed');
      }

      const result = await response.json();
      
      setIsDialogOpen(false);
      toast({
        title: "🎉 Application Submitted!",
        description: result.message,
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/candidates/my-applications')}
          >
            View Applications
          </Button>
        )
      });

    } catch (error) {
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Button
        onClick={checkEligibility}
        disabled={isChecking}
        className={className}
        variant="default"
      >
        {isChecking ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Quick Apply
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Apply to {jobTitle}
            </DialogTitle>
            <DialogDescription>
              at {companyName}
            </DialogDescription>
          </DialogHeader>

          {eligibility && (
            <div className="space-y-6">
              {/* Match Score */}
              {eligibility.matchScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Profile Match</span>
                    <span className="text-muted-foreground">{eligibility.matchScore}%</span>
                  </div>
                  <Progress value={eligibility.matchScore} className="h-2" />
                </div>
              )}

              {/* Video Introduction Preview */}
              <Alert>
                <Video className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Your video introduction will be included with this application</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open(eligibility.candidateInfo.videoIntroUrl, '_blank')}
                  >
                    Preview
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Quick Apply Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverNote">Brief Cover Note (Optional)</Label>
                  <Textarea
                    id="coverNote"
                    placeholder="Add a personal touch to your application..."
                    value={formData.coverNote}
                    onChange={(e) => setFormData({ ...formData, coverNote: e.target.value })}
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData.coverNote?.length || 0}/500 characters
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minSalary">Expected Salary Range (Optional)</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="minSalary"
                          type="number"
                          placeholder="Min"
                          className="pl-10"
                          onChange={(e) => setFormData({
                            ...formData,
                            expectedSalary: {
                              ...formData.expectedSalary || { currency: 'USD' },
                              min: parseInt(e.target.value) || 0,
                              max: formData.expectedSalary?.max || 0
                            }
                          })}
                        />
                      </div>
                      <span className="self-center">-</span>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Max"
                          className="pl-10"
                          onChange={(e) => setFormData({
                            ...formData,
                            expectedSalary: {
                              ...formData.expectedSalary || { currency: 'USD' },
                              min: formData.expectedSalary?.min || 0,
                              max: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="availableFrom">Available From (Optional)</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="availableFrom"
                        type="date"
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relocate"
                    checked={formData.willingToRelocate}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, willingToRelocate: checked as boolean })
                    }
                  />
                  <Label htmlFor="relocate" className="flex items-center gap-2 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    I'm willing to relocate for this position
                  </Label>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="text-sm font-medium">Your Profile Summary</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {eligibility.candidateInfo.experience}
                  </Badge>
                  {eligibility.candidateInfo.skills.slice(0, 5).map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {eligibility.candidateInfo.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{eligibility.candidateInfo.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickApply} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}