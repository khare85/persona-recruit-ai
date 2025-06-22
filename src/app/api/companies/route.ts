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
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'CloudScale Solutions',
    slug: 'cloudscale',
    industry: 'Cloud Computing',
    size: '100-500',
    website: 'https://cloudscale.io',
    description: 'Cloud infrastructure and DevOps solutions provider.',
    headquarters: 'Austin, TX',
    founded: '2018',
    logo: '/logos/cloudscale.png',
    status: 'active',
    subscription: {
      plan: 'professional',
      status: 'active',
      billingCycle: 'annual',
      amount: 4999,
      nextBilling: '2024-12-15'
    },
    settings: {
      publicProfile: true,
      autoScreening: false,
      screeningThreshold: 60,
      emailNotifications: true,
      maxDailyInterviews: 3
    },
    stats: {
      totalEmployees: 280,
      activeJobs: 8,
      totalCandidates: 156,
      thisMonthHires: 5
    },
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-06-18T11:15:00Z'
  },
  {
    id: '3',
    name: 'DesignFirst Studio',
    slug: 'designfirst',
    industry: 'Design & Creative',
    size: '50-100',
    website: 'https://designfirst.studio',
    description: 'Creative design studio specializing in user experience and branding.',
    headquarters: 'New York, NY',
    founded: '2019',
    logo: '/logos/designfirst.png',
    status: 'active',
    subscription: {
      plan: 'startup',
      status: 'active',
      billingCycle: 'monthly',
      amount: 299,
      nextBilling: '2024-07-05'
    },
    settings: {
      publicProfile: false,
      autoScreening: true,
      screeningThreshold: 75,
      emailNotifications: false,
      maxDailyInterviews: 2
    },
    stats: {
      totalEmployees: 85,
      activeJobs: 4,
      totalCandidates: 92,
      thisMonthHires: 3
    },
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-06-19T16:45:00Z'
  }
];

// GET /api/companies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const size = searchParams.get('size') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filter companies based on query parameters
    let filteredCompanies = companies.filter(company => {
      const matchesSearch = !search || 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesIndustry = !industry || company.industry === industry;
      const matchesSize = !size || company.size === size;
      const matchesStatus = !status || company.status === status;

      return matchesSearch && matchesIndustry && matchesSize && matchesStatus;
    });

    // Sort companies
    filteredCompanies.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      // Handle nested properties
      if (sortBy === 'employees') {
        aValue = a.stats.totalEmployees;
        bValue = b.stats.totalEmployees;
      } else if (sortBy === 'jobs') {
        aValue = a.stats.activeJobs;
        bValue = b.stats.activeJobs;
      } else if (sortBy === 'subscription') {
        aValue = a.subscription.plan;
        bValue = b.subscription.plan;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    const response = {
      data: paginatedCompanies,
      pagination: {
        page,
        limit,
        total: filteredCompanies.length,
        totalPages: Math.ceil(filteredCompanies.length / limit),
        hasNext: endIndex < filteredCompanies.length,
        hasPrev: page > 1
      },
      filters: {
        industries: [...new Set(companies.map(c => c.industry))],
        sizes: [...new Set(companies.map(c => c.size))],
        statuses: [...new Set(companies.map(c => c.status))]
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'industry', 'size', 'website', 'headquarters'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new company
    const newCompany = {
      id: (companies.length + 1).toString(),
      slug: body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      name: body.name,
      industry: body.industry,
      size: body.size,
      website: body.website,
      description: body.description || '',
      headquarters: body.headquarters,
      founded: body.founded || new Date().getFullYear().toString(),
      logo: body.logo || '/logos/default.png',
      status: 'active',
      subscription: {
        plan: body.plan || 'startup',
        status: 'active',
        billingCycle: body.billingCycle || 'monthly',
        amount: body.amount || 299,
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      settings: {
        publicProfile: body.publicProfile ?? true,
        autoScreening: body.autoScreening ?? false,
        screeningThreshold: body.screeningThreshold || 70,
        emailNotifications: body.emailNotifications ?? true,
        maxDailyInterviews: body.maxDailyInterviews || 4
      },
      stats: {
        totalEmployees: 0,
        activeJobs: 0,
        totalCandidates: 0,
        thisMonthHires: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In production, save to database
    companies.push(newCompany);

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}