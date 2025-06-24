'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  Zap,
  Brain,
  Users,
  Briefcase,
  Building,
  Star,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Globe,
  Sparkles,
  Target,
  Award,
  MessageSquare,
  Video,
  BarChart3,
  Search,
  Heart,
  Rocket,
  Crown,
  Infinity,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Play
} from 'lucide-react';

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Advanced machine learning algorithms match candidates with perfect job opportunities using semantic analysis and skill compatibility.",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop&crop=face",
      stats: "95% accuracy"
    },
    {
      icon: Video,
      title: "Smart Video Interviews",
      description: "Automated video screening with AI analysis of communication skills, technical competency, and cultural fit assessment.",
      image: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400&h=250&fit=crop&crop=face",
      stats: "80% time saved"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights into recruitment performance, candidate pipeline health, and hiring success metrics.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center",
      stats: "360° insights"
    },
    {
      icon: Users,
      title: "Talent Pool Management",
      description: "Build and maintain comprehensive talent databases with AI-enhanced candidate profiles and engagement tracking.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop&crop=faces",
      stats: "Unlimited profiles"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Multi-language support and international compliance features for worldwide talent acquisition campaigns.",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop&crop=center",
      stats: "50+ countries"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with SOC 2 compliance, data encryption, and comprehensive audit trails.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop&crop=center",
      stats: "99.9% uptime"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small teams and startups",
      icon: Rocket,
      color: "border-blue-200 bg-blue-50",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      features: [
        "Up to 5 job postings",
        "100 candidate profiles",
        "Basic AI matching",
        "Email support",
        "Standard analytics",
        "Mobile app access"
      ],
      limitations: [
        "No video interviews",
        "Basic templates only",
        "Standard integrations"
      ]
    },
    {
      name: "Professional",
      price: "$299",
      period: "/month",
      description: "Ideal for growing companies",
      icon: Crown,
      color: "border-purple-200 bg-purple-50",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      popular: true,
      features: [
        "Unlimited job postings",
        "1,000 candidate profiles",
        "Advanced AI matching",
        "Video interview platform",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Team collaboration tools"
      ],
      limitations: []
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with complex needs",
      icon: Infinity,
      color: "border-gold-200 bg-gold-50",
      buttonColor: "bg-gold-600 hover:bg-gold-700",
      features: [
        "Unlimited everything",
        "White-label solution",
        "Custom AI models",
        "Dedicated support manager",
        "SLA guarantees",
        "Advanced security features",
        "Custom integrations",
        "Training & onboarding",
        "Multi-region deployment"
      ],
      limitations: []
    }
  ];

  const testimonials = [
    {
      quote: "AI Talent Stream revolutionized our hiring process. We reduced time-to-hire by 70% and improved candidate quality significantly.",
      author: "Sarah Johnson",
      role: "VP of Talent",
      company: "TechCorp Inc.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "The AI matching is incredibly accurate. We're finding candidates we never would have discovered through traditional methods.",
      author: "Michael Chen",
      role: "Head of Recruitment",
      company: "InnovateLab",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "Best investment we've made in our HR tech stack. The platform pays for itself through improved hiring efficiency.",
      author: "Emily Rodriguez",
      role: "CHRO",
      company: "GrowthCo",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5
    }
  ];

  const stats = [
    { number: "10,000+", label: "Companies Trust Us", icon: Building },
    { number: "500K+", label: "Successful Hires", icon: Users },
    { number: "95%", label: "Match Accuracy", icon: Target },
    { number: "70%", label: "Faster Hiring", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Talent Stream
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/support" className="text-gray-600 hover:text-blue-600 transition-colors">Support</Link>
              <Link href="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                <Zap className="h-3 w-3 mr-1" />
                Accelerating Recruitment with AI
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Hiring Process
                </span>
                with AI Intelligence
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover, engage, and hire top talent 10x faster with our AI-powered recruitment platform. 
                From intelligent matching to automated interviews, we revolutionize every step of your hiring journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 group">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-20"></div>
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&crop=center"
                  alt="AI Recruitment Dashboard"
                  width={600}
                  height={400}
                  className="relative rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">95% Match Found!</p>
                      <p className="text-sm text-gray-500">Perfect candidate identified</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">70% Faster</p>
                      <p className="text-sm text-gray-500">Time to hire</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              <Brain className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Accelerate Recruitment</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge AI technology with intuitive design 
              to streamline your entire recruitment workflow.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-video relative">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-blue-600">{feature.stats}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Platform Overview */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">Complete Recruitment Ecosystem</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Job Posting & Management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Candidate Sourcing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Application Tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Interview Scheduling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Team Collaboration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>Analytics & Reporting</span>
                  </div>
                </div>
                <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Explore All Features
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=350&fit=crop&crop=center"
                  alt="Platform Dashboard"
                  width={500}
                  height={350}
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              <Heart className="h-3 w-3 mr-1" />
              Loved by Teams
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about transforming their recruitment process
            </p>
          </div>

          <div className="relative">
            <Card className="max-w-4xl mx-auto p-8 lg:p-12">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-2xl font-medium text-gray-900 mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <Image
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].author}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].author}</p>
                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                    <p className="text-sm text-gray-500">{testimonials[currentTestimonial].company}</p>
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              <Crown className="h-3 w-3 mr-1" />
              Flexible Pricing
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center">
                      <plan.icon className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full ${plan.buttonColor}`}>
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">All plans include our core features and 24/7 support</p>
            <Link href="/support" className="text-blue-600 hover:underline">
              Need help choosing? Contact our sales team →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Accelerate Your Recruitment?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies that have transformed their hiring process with AI Talent Stream.
            Start your free trial today and experience the future of recruitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/support">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AI Talent Stream</span>
              </div>
              <p className="text-gray-400 mb-4">
                Accelerating recruitment with AI-powered intelligence. 
                Transform your hiring process and find the perfect candidates faster.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/auth" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/auth" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/support" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/support" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/support" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-white">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 AI Talent Stream. All rights reserved.</p>
            <p className="text-gray-400 mt-4 md:mt-0">Made with ❤️ for better recruitment</p>
          </div>
        </div>
      </footer>
    </div>
  );
}