
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/shared/Container';
import { Gift, Users, Share2, DollarSign, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ReferralsPage() {
  return (
    <Container>
      <div className="text-center mb-12">
        <Gift className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-foreground">
          AI Talent Stream Referral Program
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Share the benefits of AI-powered recruitment and earn rewards! Help your network find amazing opportunities or top talent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* How it Works Card */}
        <Card className="shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Users className="mr-3 h-7 w-7 text-accent" />
              How It Works
            </CardTitle>
            <CardDescription>Simple steps to start earning rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-grow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold">Share Your Link</h4>
                <p className="text-sm text-muted-foreground">Use your unique referral link to invite candidates or companies.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold">They Sign Up</h4>
                <p className="text-sm text-muted-foreground">Your referrals create an account or post their first job.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold">You Get Rewarded</h4>
                <p className="text-sm text-muted-foreground">Earn cash or platform credits for successful referrals.</p>
              </div>
            </div>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">Terms and conditions apply. Rewards vary based on referral type.</p>
          </CardFooter>
        </Card>

        {/* Your Referral Link Card */}
        <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Share2 className="mr-3 h-7 w-7 text-primary" />
              Your Referral Hub
            </CardTitle>
            <CardDescription>Start sharing and tracking your referrals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div>
              <label htmlFor="referralLink" className="block text-sm font-medium text-muted-foreground mb-1">
                Your Unique Referral Link:
              </label>
              <div className="flex space-x-2">
                <Input id="referralLink" value="https://aitalentstream.com/referral?id=YOUR_UNIQUE_ID" readOnly />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText('https://aitalentstream.com/referral?id=YOUR_UNIQUE_ID')}>
                  Copy
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 border rounded-lg bg-background">
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-background">
                <p className="text-3xl font-bold text-primary">$250</p>
                <p className="text-sm text-muted-foreground">Rewards Earned</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
             <Button className="w-full">View Referral Dashboard</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Rewards Section */}
      <section className="mt-16 py-12 bg-muted/30 rounded-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-headline font-semibold text-foreground">
              What You Can Earn
            </h2>
            <p className="mt-2 text-md text-muted-foreground">
              Generous rewards for helping us grow our community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="mx-auto h-10 w-10 text-accent mb-2" />
                <CardTitle className="text-xl">Refer a Candidate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary mb-1">$50 Reward</p>
                <p className="text-sm text-muted-foreground">When they successfully complete their profile and get shortlisted for a job.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="mx-auto h-10 w-10 text-accent mb-2" />
                <CardTitle className="text-xl">Refer a Company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary mb-1">$200 Reward</p>
                <p className="text-sm text-muted-foreground">When they post their first job and make a successful hire through our platform.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mt-16 text-center">
         <Image 
            src="https://placehold.co/700x300.png" 
            alt="Referral program visual" 
            width={700} 
            height={300} 
            className="rounded-lg mx-auto shadow-md"
            data-ai-hint="network connection"
          />
        <p className="mt-6 text-lg text-muted-foreground">
          Questions? Read our <Link href="#" className="text-primary hover:underline">Referral Program FAQ</Link> or <Link href="#" className="text-primary hover:underline">Contact Support</Link>.
        </p>
      </div>
    </Container>
  );
}
