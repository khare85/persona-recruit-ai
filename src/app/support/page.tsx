'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Search,
  Book,
  Video,
  FileText,
  Users,
  Zap,
  Shield,
  Settings,
  HelpCircle,
  Send,
  Upload,
  Star,
  ThumbsUp,
  Calendar,
  Globe,
  Headphones,
  Lightbulb,
  Target,
  Award,
  Sparkles
} from 'lucide-react';

export default function SupportPage() {
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    priority: '',
    description: '',
    attachments: null as File[] | null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportCategories = [
    {
      icon: Settings,
      title: "Technical Support",
      description: "Help with platform functionality, integrations, and troubleshooting",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      icon: Users,
      title: "Account Management",
      description: "Billing questions, subscription changes, and account settings",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Lightbulb,
      title: "Feature Requests",
      description: "Suggest new features or improvements to existing functionality",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Data security, privacy concerns, and compliance questions",
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600"
    }
  ];

  const faqCategories = [
    {
      title: "Getting Started",
      questions: [
        {
          question: "How do I set up my company account?",
          answer: "Setting up your company account is easy! After signing up, you'll be guided through our onboarding wizard. First, complete your company profile with basic information like company name, size, and industry. Then, customize your branding with your logo and colors. Finally, invite team members and set up their roles and permissions."
        },
        {
          question: "What integrations are available?",
          answer: "AI Talent Stream integrates with popular HR tools including Slack, Microsoft Teams, Google Workspace, Zoom, ATS systems like Greenhouse and Lever, and job boards like LinkedIn, Indeed, and Glassdoor. We also offer API access for custom integrations."
        },
        {
          question: "How does AI matching work?",
          answer: "Our AI analyzes job descriptions and candidate profiles using natural language processing and machine learning. It considers skills, experience, location preferences, salary expectations, and cultural fit indicators to generate match scores between 0-100%. The system continuously learns from successful hires to improve accuracy."
        }
      ]
    },
    {
      title: "AI Features",
      questions: [
        {
          question: "How accurate is the AI matching?",
          answer: "Our AI matching achieves 95% accuracy based on successful hire outcomes. The system analyzes over 200 data points including skills, experience patterns, communication style, and cultural indicators. Accuracy improves over time as the AI learns from your hiring decisions."
        },
        {
          question: "Can I customize AI recommendations?",
          answer: "Yes! You can adjust AI weighting for different criteria like experience level, specific skills, location, and salary ranges. You can also provide feedback on recommendations to train the AI for your specific preferences and company culture."
        },
        {
          question: "What languages does the AI support?",
          answer: "Our AI currently supports 12 languages including English, Spanish, French, German, Italian, Portuguese, Dutch, Japanese, Korean, Mandarin, Hindi, and Arabic. Multi-language support allows for global talent sourcing and candidate communication."
        }
      ]
    },
    {
      title: "Billing & Plans",
      questions: [
        {
          question: "Can I change my plan anytime?",
          answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at your next billing cycle. We'll prorate charges for mid-cycle upgrades and provide credits for downgrades."
        },
        {
          question: "Is there a free trial?",
          answer: "We offer a 14-day free trial with full access to Professional plan features. No credit card required to start. You can explore all features including AI matching, video interviews, and analytics during your trial period."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and bank transfers for Enterprise plans. All payments are processed securely through our PCI-compliant payment system."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "Available 24/7",
      action: "Start Chat",
      color: "bg-blue-600"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with an expert",
      availability: "Mon-Fri, 9AM-6PM EST",
      action: "Call Now",
      color: "bg-green-600",
      detail: "+1 (555) 123-4567"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Get detailed help via email",
      availability: "Response within 4 hours",
      action: "Send Email",
      color: "bg-purple-600",
      detail: "support@aitalentstream.com"
    },
    {
      icon: Calendar,
      title: "Schedule Call",
      description: "Book a personalized demo",
      availability: "Choose your time",
      action: "Book Demo",
      color: "bg-orange-600"
    }
  ];

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset form
    setTicketForm({
      name: '',
      email: '',
      subject: '',
      category: '',
      priority: '',
      description: '',
      attachments: null
    });
    
    setIsSubmitting(false);
    alert('Support ticket submitted successfully! You\'ll receive a confirmation email shortly.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTicketForm(prev => ({ ...prev, attachments: Array.from(e.target.files!) }));
    }
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Talent Stream
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
            <Headphones className="h-3 w-3 mr-1" />
            24/7 Support
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            How Can We
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Help You?</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get instant help from our expert support team. We're here to ensure your recruitment success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <MessageSquare className="mr-2 h-5 w-5" />
              Start Live Chat
            </Button>
            <Button size="lg" variant="outline">
              <Phone className="mr-2 h-5 w-5" />
              Call Support
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs defaultValue="help" className="space-y-8">
          <TabsList className="grid grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="help">Help Center</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Help Center Tab */}
          <TabsContent value="help" className="space-y-8">
            {/* Search */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Support Categories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportCategories.map((category, index) => (
                <Card key={index} className={`${category.color} hover:shadow-lg transition-shadow cursor-pointer`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center">
                        <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-gray-600">Find quick answers to common questions</p>
              </div>

              {filteredFAQs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HelpCircle className="mr-2 h-5 w-5 text-blue-600" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Us Tab */}
          <TabsContent value="contact" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-lg text-gray-600">Choose the best way to reach our support team</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {contactMethods.map((method, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`h-12 w-12 ${method.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <method.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                        <p className="text-gray-600 mb-2">{method.description}</p>
                        <p className="text-sm text-gray-500 mb-3">{method.availability}</p>
                        {method.detail && (
                          <p className="text-sm font-medium text-gray-900 mb-3">{method.detail}</p>
                        )}
                        <Button size="sm" className={method.color}>
                          {method.action}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Office Locations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-blue-600" />
                  Our Offices
                </CardTitle>
                <CardDescription>Visit us at our global locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Image
                      src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300&h=200&fit=crop&crop=center"
                      alt="New York Office"
                      width={300}
                      height={200}
                      className="rounded-lg mb-4"
                    />
                    <h4 className="font-semibold mb-2">New York (HQ)</h4>
                    <p className="text-sm text-gray-600">
                      123 Tech Avenue<br />
                      New York, NY 10001<br />
                      +1 (555) 123-4567
                    </p>
                  </div>
                  <div className="text-center">
                    <Image
                      src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=200&fit=crop&crop=center"
                      alt="London Office"
                      width={300}
                      height={200}
                      className="rounded-lg mb-4"
                    />
                    <h4 className="font-semibold mb-2">London</h4>
                    <p className="text-sm text-gray-600">
                      45 Innovation Street<br />
                      London, EC2A 4DP<br />
                      +44 20 7123 4567
                    </p>
                  </div>
                  <div className="text-center">
                    <Image
                      src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=200&fit=crop&crop=center"
                      alt="Tokyo Office"
                      width={300}
                      height={200}
                      className="rounded-lg mb-4"
                    />
                    <h4 className="font-semibold mb-2">Tokyo</h4>
                    <p className="text-sm text-gray-600">
                      7-8-9 Startup District<br />
                      Tokyo, 150-0001<br />
                      +81 3 1234 5678
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Ticket Tab */}
          <TabsContent value="ticket" className="space-y-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Submit Support Ticket</h2>
                <p className="text-lg text-gray-600">
                  Can't find what you're looking for? Submit a detailed support request
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleTicketSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          required
                          value={ticketForm.name}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          required
                          value={ticketForm.email}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        required
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <Select 
                          value={ticketForm.category} 
                          onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="billing">Billing & Account</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="security">Security & Privacy</SelectItem>
                            <SelectItem value="integration">Integration Help</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority *
                        </label>
                        <Select 
                          value={ticketForm.priority} 
                          onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General question</SelectItem>
                            <SelectItem value="medium">Medium - Feature issue</SelectItem>
                            <SelectItem value="high">High - System down</SelectItem>
                            <SelectItem value="urgent">Urgent - Critical business impact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <Textarea
                        required
                        rows={6}
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drop files here or click to upload
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                        />
                        <label htmlFor="file-upload">
                          <Button type="button" variant="outline" size="sm">
                            Choose Files
                          </Button>
                        </label>
                        {ticketForm.attachments && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500">
                              {ticketForm.attachments.length} file(s) selected
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Resources & Documentation</h2>
              <p className="text-lg text-gray-600">Everything you need to master AI Talent Stream</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Book className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Documentation</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Comprehensive guides, API references, and setup instructions
                  </p>
                  <Button variant="outline" size="sm">
                    Browse Docs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Video className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Video Tutorials</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Step-by-step video guides for all platform features
                  </p>
                  <Button variant="outline" size="sm">
                    Watch Videos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Community</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Connect with other users, share tips, and get advice
                  </p>
                  <Button variant="outline" size="sm">
                    Join Community
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Resource Categories */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guides</CardTitle>
                  <CardDescription>Get up and running in minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">Setting up your first job posting</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">Configuring AI matching preferences</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">Inviting team members</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Features</CardTitle>
                  <CardDescription>Master the full platform potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">API integration guide</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">Custom AI model training</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">White-label customization</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}