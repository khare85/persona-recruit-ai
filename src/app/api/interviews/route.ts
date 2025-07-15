import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/config/firebase';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';

/**
 * GET /api/interviews - Get interviews with filtering and pagination
 */
async function handleGET(req: NextRequest & { user?: { uid: string } }): Promise<NextResponse> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const interviewerId = searchParams.get('interviewerId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build Firestore query
    let interviewsQuery = query(
      collection(db, 'interviews'),
      orderBy('scheduledDate', 'desc')
    );

    // Apply filters
    if (candidateId) {
      interviewsQuery = query(interviewsQuery, where('candidateId', '==', candidateId));
    }
    if (interviewerId) {
      interviewsQuery = query(interviewsQuery, where('interviewerId', '==', interviewerId));
    }
    if (jobId) {
      interviewsQuery = query(interviewsQuery, where('jobId', '==', jobId));
    }
    if (status) {
      interviewsQuery = query(interviewsQuery, where('status', '==', status));
    }
    if (companyId) {
      interviewsQuery = query(interviewsQuery, where('companyId', '==', companyId));
    }

    const querySnapshot = await getDocs(interviewsQuery);
    const interviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInterviews = interviews.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedInterviews,
      pagination: {
        page,
        limit,
        total: interviews.length,
        totalPages: Math.ceil(interviews.length / limit),
        hasNext: endIndex < interviews.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interviews - Create a new interview
 */
async function handlePOST(req: NextRequest & { user?: { uid: string } }): Promise<NextResponse> {
  try {
    const body = await req.json();
    const userId = req.user?.uid;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Validate required fields
    const requiredFields = ['candidateId', 'jobId', 'interviewerId', 'scheduledDate', 'duration'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create interview document
    const interviewData = {
      candidateId: body.candidateId,
      jobId: body.jobId,
      interviewerId: body.interviewerId,
      scheduledDate: body.scheduledDate,
      duration: body.duration,
      type: body.type || 'general',
      format: body.format || 'virtual',
      location: body.location || '',
      status: 'scheduled',
      meetingLink: body.meetingLink || null,
      notes: body.notes || '',
      preparation: body.preparation || [],
      feedback: null,
      recording: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId
    };

    const docRef = await addDoc(collection(db, 'interviews'), interviewData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...interviewData
      },
      message: 'Interview scheduled successfully'
    });

  } catch (error) {
    console.error('Failed to create interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}

// Apply authentication middleware and export
export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);