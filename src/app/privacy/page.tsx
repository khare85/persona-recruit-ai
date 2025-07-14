
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  Database,
  Globe,
  Mail,
  CalendarDays,
  FileText,
  Users,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 24, 2024";

  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: Database,
      content: [
        {
          subtitle: "Personal Information",
          text: "We collect information you provide directly to us, such as when you create an account, upload your resume, apply for jobs, or contact us for support. This may include your name, email address, phone number, work history, education, skills, and other professional information."
        },
        {
          subtitle: "Usage Information", 
          text: "We automatically collect certain information about your device and how you use our platform, including your IP address, browser type, operating system, referring URLs, pages viewed, and the dates/times of your visits."
        },
        {
          subtitle: "Cookies and Tracking",
          text: "We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize your experience on our platform."
        }
      ]
    },
    {
      id: "information-use",
      title: "How We Use Your Information",
      icon: Settings,
      content: [
        {
          subtitle: "Platform Services",
          text: "We use your information to provide, maintain, and improve our recruitment platform, including matching candidates with job opportunities, facilitating communications between employers and candidates, and providing customer support."
        },
        {
          subtitle: "AI Matching",
          text: "Our AI algorithms analyze your profile information to provide personalized job recommendations and help employers find suitable candidates. This processing is essential to our core service."
        },
        {
          subtitle: "Communications",
          text: "We may send you emails about your account, job opportunities, platform updates, and promotional content. You can opt out of promotional emails at any time."
        }
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing and Disclosure",
      icon: Users,
      content: [
        {
          subtitle: "With Employers",
          text: "When you apply for a job or express interest in an opportunity, we share relevant profile information with the prospective employer. You control what information is included in your public profile."
        },
        {
          subtitle: "Service Providers",
          text: "We may share your information with third-party service providers who assist us in operating our platform, conducting business, or servicing you, provided they agree to keep this information confidential."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required to do so by law or in response to valid requests by public authorities."
        }
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
        },
        {
          subtitle: "Encryption",
          text: "All data transmission is encrypted using industry-standard SSL/TLS protocols. Personal information is encrypted at rest using AES-256 encryption."
        },
        {
          subtitle: "Access Controls",
          text: "We maintain strict access controls and regularly audit our systems to ensure only authorized personnel can access personal information on a need-to-know basis."
        }
      ]
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: CalendarDays,
      content: [
        {
          subtitle: "Active Accounts",
          text: "We retain your personal information for as long as your account is active or as needed to provide you with our services."
        },
        {
          subtitle: "Inactive Accounts",
          text: "If your account becomes inactive for 3 years, we may delete your personal information unless you have ongoing applications or contractual obligations."
        },
        {
          subtitle: "Legal Obligations",
          text: "We may retain certain information for longer periods if required by law or to comply with legal obligations, resolve disputes, or enforce agreements."
        }
      ]
    },
    {
      id: "your-rights",
      title: "Your Privacy Rights",
      icon: Shield,
      content: [
        {
          subtitle: "Access and Portability",
          text: "You have the right to access, update, or download your personal information. You can do this through your account settings or by contacting us."
        },
        {
          subtitle: "Correction and Deletion",
          text: "You can correct inaccurate information or request deletion of your personal information, subject to certain legal limitations."
        },
        {
          subtitle: "Marketing Opt-out",
          text: "You can opt out of receiving promotional communications from us by following the unsubscribe instructions in our emails or updating your account preferences."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      
      {/* Header */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Privacy Policy
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Your Privacy
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
                Matters to Us
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              This Privacy Policy describes how Persona Recruit AI collects, uses, and protects your personal information.
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
        {/* Overview */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Overview</h3>
                <p className="text-gray-700 leading-relaxed">
                  At Persona Recruit AI, we are committed to protecting your privacy and personal information. 
                  We collect only the information necessary to provide our recruitment services, use industry-standard 
                  security measures to protect your data, and give you control over how your information is used. 
                  We never sell your personal information to third parties.
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

        {/* International Transfers */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              International Data Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Persona Recruit AI operates globally, and your information may be transferred to and processed in 
              countries other than your own. We ensure that all international data transfers comply with applicable 
              data protection laws and implement appropriate safeguards to protect your personal information.
            </p>
            <p className="text-gray-600 leading-relaxed">
              For transfers from the European Economic Area (EEA), we rely on adequacy decisions, standard 
              contractual clauses, or other legally recognized transfer mechanisms to ensure your data receives 
              adequate protection.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              Children's Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Our platform is not intended for use by individuals under the age of 16. We do not knowingly 
              collect personal information from children under 16. If we become aware that we have collected 
              personal information from a child under 16, we will take steps to delete such information.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <div className="h-10 w-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              Changes to This Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              applicable laws. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying a prominent notice on our platform</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Continued use of our platform after the effective date of the updated policy constitutes 
              your acceptance of the changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-green-100" />
            <h3 className="text-2xl font-bold mb-4">Questions About Privacy?</h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              If you have any questions about this Privacy Policy or our privacy practices, 
              please don't hesitate to contact us.
            </p>
            <div className="space-y-2 text-green-100">
              <p><strong>Email:</strong> privacy@personarecruitai.com</p>
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
