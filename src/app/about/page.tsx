'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Users,
  Target,
  Globe,
  Award,
  Heart,
  Lightbulb,
  Shield,
  TrendingUp,
  Brain,
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  Linkedin
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Brain,
      title: "Innovation First",
      description: "We leverage cutting-edge AI technology to solve complex recruitment challenges and stay ahead of industry trends."
    },
    {
      icon: Heart,
      title: "Human-Centric",
      description: "Technology serves people, not the other way around. We design solutions that enhance human decision-making."
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We build secure, reliable platforms with clear processes and ethical AI practices at our core."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Our mission is to democratize access to top talent worldwide, breaking down geographical barriers."
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at Google, passionate about using AI to solve human challenges.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO & Co-Founder", 
      bio: "Ex-Netflix ML engineer with 15+ years in scalable AI systems and machine learning.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Emily Johnson",
      role: "Head of Product",
      bio: "Previously at Airbnb, specializing in user experience design and product strategy.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "David Kim",
      role: "VP of Engineering",
      bio: "Former Microsoft architect, expert in building enterprise-scale recruitment platforms.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"
    }
  ];

  const stats = [
    { number: "50M+", label: "Candidates Matched" },
    { number: "25K+", label: "Companies Served" },
    { number: "150+", label: "Countries" },
    { number: "95%", label: "Customer Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Persona Recruit AI
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
            <Users className="h-3 w-3 mr-1" />
            About Our Mission
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Transforming Recruitment
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
              Through AI Innovation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're on a mission to revolutionize how companies discover, engage, and hire exceptional talent. 
            By combining advanced AI with human insight, we're making recruitment faster, fairer, and more effective.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Stats Section */}
        <section className="mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <h3 className="text-3xl font-bold text-green-600 mb-2">{stat.number}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2021 by a team of AI researchers and recruitment experts, Persona Recruit AI was born 
                  from a simple observation: traditional hiring processes were broken, biased, and inefficient.
                </p>
                <p>
                  We witnessed talented individuals overlooked due to unconscious bias, and companies struggling 
                  to find the right candidates despite having access to millions of resumes. There had to be a better way.
                </p>
                <p>
                  Our breakthrough came when we developed an AI system that could understand not just skills and 
                  experience, but also personality traits, cultural fit, and potential for growth. This technology 
                  became the foundation of Persona Recruit AI.
                </p>
                <p>
                  Today, we're proud to serve thousands of companies worldwide, from fast-growing startups to 
                  Fortune 500 enterprises, helping them build diverse, high-performing teams.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&crop=center"
                alt="Our Team"
                width={600}
                height={400}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <value.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">The passionate people behind Persona Recruit AI</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={120}
                    height={120}
                    className="rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-green-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-20">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-12 text-center">
              <Target className="h-16 w-16 mx-auto mb-6 text-green-100" />
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                To democratize access to opportunity by creating the world's most intelligent, 
                fair, and efficient recruitment platform. We believe everyone deserves a chance 
                to find meaningful work, and every company deserves access to exceptional talent.
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <h4 className="font-semibold mb-1">Eliminate Bias</h4>
                  <p className="text-sm text-green-100">Fair, objective evaluation for all candidates</p>
                </div>
                <div>
                  <Zap className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <h4 className="font-semibold mb-1">Accelerate Hiring</h4>
                  <p className="text-sm text-green-100">Reduce time-to-hire by up to 70%</p>
                </div>
                <div>
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-200" />
                  <h4 className="font-semibold mb-1">Improve Quality</h4>
                  <p className="text-sm text-green-100">Better matches, higher retention rates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card>
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join Us?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you're looking to transform your hiring process or join our team, 
                we'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/careers">
                  <Button size="lg" variant="outline">
                    View Open Positions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}