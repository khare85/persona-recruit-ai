import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyticsService } from '@/services/aiAnalytics.service';
import { AIOperationMetric } from '@/types/analytics.types';
import { dbLogger } from '@/lib/logger';
import { verifyUserRole } from '@/utils/auth';

/**
 * POST /api/ai-analytics/metrics
 * Record a new AI operation metric
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user has permission to record metrics
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin', 'recruiter', 'system']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['operationType', 'executionTimeMs', 'modelUsed', 'success'];
    const missingFields = requiredFields.filter(field => body[field] === undefined);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }

    // Prepare metric data
    const metricData: Omit<AIOperationMetric, 'id' | 'createdAt'> = {
      operationType: body.operationType,
      executionTimeMs: body.executionTimeMs,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      modelUsed: body.modelUsed,
      success: body.success,
      errorType: body.errorType,
      errorMessage: body.errorMessage,
      confidenceScore: body.confidenceScore,
      accuracyScore: body.accuracyScore,
      relevanceScore: body.relevanceScore,
      userFeedback: body.userFeedback,
      userId: body.userId || userInfo.user.id,
      companyId: body.companyId || userInfo.user.companyId,
      jobId: body.jobId,
      candidateId: body.candidateId,
      applicationId: body.applicationId,
      demographicData: body.demographicData,
      biasFlags: body.biasFlags,
      fairnessScore: body.fairnessScore,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
    };

    // Record the metric
    const metricId = await aiAnalyticsService.recordAIOperation(metricData);

    dbLogger.info('AI operation metric recorded via API', {
      metricId,
      operationType: metricData.operationType,
      success: metricData.success,
      userId: userInfo.user.id,
      companyId: userInfo.user.companyId
    });

    return NextResponse.json({
      success: true,
      metricId,
      message: 'AI operation metric recorded successfully'
    });

  } catch (error) {
    dbLogger.error('Error recording AI operation metric via API', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to record AI operation metric',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/ai-analytics/metrics/batch
 * Record multiple AI operation metrics in batch
 */
export async function PUT(request: NextRequest) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin', 'recruiter', 'system']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const body = await request.json();
    const { metrics } = body;

    // Validate metrics array
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid metrics array'
      }, { status: 400 });
    }

    if (metrics.length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Batch size too large (max 1000 metrics)'
      }, { status: 400 });
    }

    // Validate each metric
    const requiredFields = ['operationType', 'executionTimeMs', 'modelUsed', 'success'];
    const validationErrors: string[] = [];

    const validatedMetrics = metrics.map((metric: any, index: number) => {
      const missingFields = requiredFields.filter(field => metric[field] === undefined);
      if (missingFields.length > 0) {
        validationErrors.push(`Metric ${index}: missing fields ${missingFields.join(', ')}`);
        return null;
      }

      return {
        ...metric,
        userId: metric.userId || userInfo.user.id,
        companyId: metric.companyId || userInfo.user.companyId,
        timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date()
      };
    }).filter(Boolean);

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation errors in batch',
        validationErrors
      }, { status: 400 });
    }

    // Record metrics in batch
    const metricIds = await aiAnalyticsService.recordAIOperationsBatch(validatedMetrics);

    dbLogger.info('AI operation metrics batch recorded via API', {
      count: metricIds.length,
      userId: userInfo.user.id,
      companyId: userInfo.user.companyId,
      operationTypes: [...new Set(validatedMetrics.map(m => m.operationType))]
    });

    return NextResponse.json({
      success: true,
      metricIds,
      count: metricIds.length,
      message: 'AI operation metrics batch recorded successfully'
    });

  } catch (error) {
    dbLogger.error('Error recording AI operation metrics batch via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to record AI operation metrics batch'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai-analytics/metrics
 * Retrieve AI operation metrics with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const operationType = searchParams.get('operationType');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const success = searchParams.get('success') === 'true' ? true : searchParams.get('success') === 'false' ? false : undefined;
    const companyId = userInfo.user.role === 'admin' ? searchParams.get('companyId') : userInfo.user.companyId;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const filters: any = {};
    if (operationType) filters.operationType = operationType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (success !== undefined) filters.success = success;
    if (companyId) filters.companyId = companyId;

    // This would be implemented in the service
    // const metrics = await aiAnalyticsService.getMetrics(filters, limit, offset);

    dbLogger.info('AI operation metrics retrieved via API', {
      userId: userInfo.user.id,
      filters,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: [], // metrics would go here
      pagination: {
        limit,
        offset,
        total: 0, // would be calculated
        hasMore: false
      },
      filters
    });

  } catch (error) {
    dbLogger.error('Error retrieving AI operation metrics via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI operation metrics'
    }, { status: 500 });
  }
}