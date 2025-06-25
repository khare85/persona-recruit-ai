'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  Users,
  CreditCard,
  Globe,
  Mail,
  CalendarDays,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = "December 24, 2024";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: [
        {
          text: "By accessing or using the Persona Recruit AI platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services."
        },
        {
          text: "These terms apply to all users of the platform, including candidates, employers, recruiters, and administrators. Different user types may have additional terms specific to their use case."
        }
      ]
    },
    {
      id: "platform-description",
      title: "Platform Description",
      icon: Globe,
      content: [
        {
          text: "Persona Recruit AI is an AI-powered recruitment platform that connects employers with qualified candidates. Our services include job posting, candidate matching, applicant tracking, video interviewing, and related recruitment tools."
        },
        {
          text: "We use artificial intelligence and machine learning algorithms to analyze candidate profiles and job requirements, providing recommendations and matches. However, all final hiring decisions remain with the employer."
        }
      ]
    },
    {
      id: "user-accounts",
      title: "User Accounts and Registration",
      icon: Users,
      content: [
        {
          subtitle: "Account Creation",
          text: "To use our platform, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials."
        },
        {
          subtitle: "Eligibility",
          text: "You must be at least 16 years old to use our platform. By creating an account, you represent that you meet this age requirement and have the legal capacity to enter into these terms."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security."
        }
      ]
    },
    {
      id: "user-conduct",
      title: "User Conduct and Responsibilities",
      icon: Shield,
      content: [
        {
          subtitle: "Prohibited Activities",
          text: "You agree not to use our platform to post false, misleading, or discriminatory content; spam or solicit users; violate any laws or regulations; or interfere with the platform's operation."
        },
        {
          subtitle: "Content Standards",
          text: "All content you submit must be accurate, professional, and appropriate. You retain ownership of your content but grant us a license to use it for platform operations."
        },
        {
          subtitle: "Compliance",
          text: "You agree to comply with all applicable employment laws, including anti-discrimination laws, when using our platform for recruitment purposes."
        }
      ]
    },
    {
      id: "payment-terms",
      title: "Payment Terms and Billing",
      icon: CreditCard,
      content: [
        {
          subtitle: "Subscription Fees",
          text: "Paid features require a subscription. Fees are charged in advance on a monthly or annual basis, depending on your chosen plan. All fees are non-refundable except as required by law."
        },
        {
          subtitle: "Payment Methods",
          text: "We accept major credit cards and other payment methods as indicated during checkout. You authorize us to charge your payment method for all applicable fees."
        },
        {
          subtitle: "Price Changes",
          text: "We may change our pricing with 30 days' notice. Price changes will not affect your current billing cycle but will apply to subsequent renewals."
        }
      ]
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property Rights",
      icon: Scale,
      content: [
        {
          subtitle: "Platform Ownership",
          text: "The Persona Recruit AI platform, including all software, algorithms, designs, and content, is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute our platform."
        },
        {
          subtitle: "User Content License",
          text: "By submitting content to our platform, you grant us a worldwide, royalty-free license to use, display, and distribute your content for platform operations and improvement."
        },
        {
          subtitle: "Trademark Policy",
          text: "Our name, logo, and trademarks are our property. You may not use them without our written permission, except as necessary to identify our services."
        }
      ]
    },
    {
      id: "data-ai",
      title: "Data Usage and AI Processing",
      icon: FileText,
      content: [
        {
          subtitle: "Data Processing",
          text: "We process your data to provide recruitment services, including using AI algorithms to match candidates with job opportunities. This processing is necessary for our core services."
        },
        {
          subtitle: "AI Limitations",
          text: "While our AI is highly accurate, it is not perfect. Employers should use AI recommendations as one factor in their decision-making process, not as the sole basis for hiring decisions."
        },
        {
          subtitle: "Data Accuracy",
          text: "You are responsible for ensuring the accuracy of information you provide. Inaccurate information may affect AI matching and recommendation quality."
        }
      ]
    },
    {
      id: "privacy-data",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: [
        {
          text: "Your privacy is important to us. Our Privacy Policy, which is incorporated into these terms by reference, explains how we collect, use, and protect your personal information."
        },
        {
          text: "We comply with applicable data protection laws, including GDPR, CCPA, and other regional privacy regulations. You have rights regarding your personal data as described in our Privacy Policy."
        }
      ]
    },
    {
      id: "termination",
      title: "Termination",
      icon: XCircle,
      content: [
        {
          subtitle: "By You",
          text: "You may terminate your account at any time by contacting us or using the account deletion feature. Upon termination, your access to paid features will cease at the end of your current billing period."
        },
        {
          subtitle: "By Us",
          text: "We may suspend or terminate your account if you violate these terms, engage in fraudulent activity, or for other legitimate business reasons. We will provide notice when possible."
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination, your right to use the platform ceases immediately. We may retain certain information as required by law or for legitimate business purposes."
        }
      ]
    }
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
              <Link href="/support">
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
              <Scale className="h-3 w-3 mr-1" />
              Terms of Service
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Terms of
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
                Service
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              These terms govern your use of the Persona Recruit AI platform and services.
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <CalendarDays className="h-4 w-4 mr-2" />
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
                <p className="text-gray-700 leading-relaxed">
                  Please read these Terms of Service carefully before using our platform. By accessing or using 
                  Persona Recruit AI, you agree to be bound by these terms. If you disagree with any part of these 
                  terms, then you may not access the service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="h-5 w-5 text-green-600" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.subtitle && (
                      <h4 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h4>
                    )}
                    <p className="text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimers */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <AlertTriangle className="h-5 w-5 text-green-600" />
              </div>
              Disclaimers and Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Service Availability</h4>
              <p className="text-gray-600 leading-relaxed">
                While we strive for 99.9% uptime, we cannot guarantee that our platform will be available at all times. 
                We may experience downtime for maintenance, updates, or due to factors beyond our control.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Accuracy</h4>
              <p className="text-gray-600 leading-relaxed">
                Our AI algorithms are designed to provide accurate matching and recommendations, but they are not 
                infallible. Users should exercise their own judgment and not rely solely on AI recommendations for 
                important decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Third-Party Content</h4>
              <p className="text-gray-600 leading-relaxed">
                Our platform may contain links to third-party websites or integrate with third-party services. 
                We are not responsible for the content, policies, or practices of these third parties.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <Scale className="h-5 w-5 text-green-600" />
              </div>
              Governing Law and Disputes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of the State of 
              California, without regard to its conflict of law provisions. Any disputes arising from these terms 
              or your use of our platform will be resolved through binding arbitration.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Before initiating arbitration, we encourage you to contact us directly to resolve any disputes 
              informally. Many issues can be resolved quickly through direct communication.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              Changes to These Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any 
              material changes by:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Posting updated terms on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices on our platform</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Continued use of our platform after changes take effect constitutes acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-green-100" />
            <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              If you have any questions about these Terms of Service, please contact us. 
              We're here to help clarify any concerns you may have.
            </p>
            <div className="space-y-2 text-green-100">
              <p><strong>Email:</strong> legal@personarecruitai.com</p>
              <p><strong>Address:</strong> 123 Tech Avenue, San Francisco, CA 94105</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
            <div className="mt-6">
              <Link href="/support">
                <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}