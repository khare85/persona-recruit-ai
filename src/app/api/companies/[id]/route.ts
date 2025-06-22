import { NextRequest, NextResponse } from 'next/server';

// Mock company data - in production this would come from a database
const companies = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    slug: 'techcorp',
    industry: 'Technology',
    size: '500-1000',
    website: 'https://techcorp.com',
    description: 'Leading technology company specializing in innovative software solutions.',
    headquarters: 'San Francisco, CA',
    founded: '2015',
    logo: '/logos/techcorp.png',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      status: 'active',
      billingCycle: 'monthly',
      amount: 999,
      nextBilling: '2024-07-01'
    },
    settings: {
      publicProfile: true,
      autoScreening: true,
      screeningThreshold: 70,
      emailNotifications: true,
      maxDailyInterviews: 4
    },
    stats: {
      totalEmployees: 750,
      activeJobs: 12,
      totalCandidates: 245,
      thisMonthHires: 8
    },
    departments: [
      { id: '1', name: 'Engineering', employees: 45 },
      { id: '2', name: 'Product', employees: 12 },
      { id: '3', name: 'Design', employees: 8 },
      { id: '4', name: 'Marketing', employees: 15 }
    ],
    team: [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'HR Director',
        email: 'sarah@techcorp.com',
        permissions: 'admin'
      },
      {
        id: '2',
        name: 'Mike Chen',
        role: 'Engineering Manager',
        email: 'mike@techcorp.com',
        permissions: 'recruiter'
      }
    ],
    interviewers: [
      {
        id: '1',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@techcorp.com',
        department: 'Engineering',
        specializations: ['Frontend Development', 'System Design'],
        totalInterviews: 156,
        rating: 4.8,
        status: 'active'
      },
      {
        id: '2',
        name: 'Maria Garcia',
        email: 'maria.garcia@techcorp.com',
        department: 'Product',
        specializations: ['Product Strategy', 'User Research'],
        totalInterviews: 89,
        rating: 4.6,
        status: 'active'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-20T14:30:00Z'
  }
];

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/companies/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const company = companies.find(c => c.id === id || c.slug === id);
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const companyIndex = companies.findIndex(c => c.id === id || c.slug === id);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Update company data
    const updatedCompany = {
      ...companies[companyIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    // In production, update in database
    companies[companyIndex] = updatedCompany;

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const companyIndex = companies.findIndex(c => c.id === id || c.slug === id);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // In production, this would be a soft delete or archive
    const deletedCompany = companies.splice(companyIndex, 1)[0];

    return NextResponse.json({ 
      message: 'Company deleted successfully',
      company: deletedCompany 
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}