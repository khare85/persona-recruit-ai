import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyticsService } from '@/services/aiAnalytics.service';
import { dbLogger } from '@/lib/logger';
import { verifyUserRole } from '@/utils/auth';

/**
 * GET /api/ai-analytics/alerts
 * Retrieve active alerts for performance and bias monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      severity: searchParams.get('severity'),
      type: searchParams.get('type'),
      acknowledged: searchParams.get('acknowledged') === 'true' ? true : 
                   searchParams.get('acknowledged') === 'false' ? false : undefined,
      companyId: userInfo.user.role === 'admin' ? searchParams.get('companyId') : userInfo.user.companyId,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Get active alerts (this would be implemented in the service)
    const alerts = await getActiveAlerts(filters);

    dbLogger.info('AI analytics alerts retrieved via API', {
      userId: userInfo.user.id,
      companyId: userInfo.user.companyId,
      alertCount: alerts.length,
      filters
    });

    return NextResponse.json({
      success: true,
      data: alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length
      },
      filters
    });

  } catch (error) {
    dbLogger.error('Error retrieving AI analytics alerts via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve alerts'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai-analytics/alerts
 * Create a new alert (usually triggered by system)
 */
export async function POST(request: NextRequest) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'system']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      severity, 
      message, 
      data,
      companyId,
      operationType,
      metricId,
      threshold,
      actualValue
    } = body;

    // Validate required fields
    if (!type || !severity || !message) {
      return NextResponse.json({
        success: false,
        error: 'Type, severity, and message are required'
      }, { status: 400 });
    }

    // Create alert (this would be implemented in the service)
    const alertId = await createAlert({
      type,
      severity,
      message,
      data,
      companyId,
      operationType,
      metricId,
      threshold,
      actualValue,
      timestamp: new Date(),
      acknowledged: false,
      createdBy: userInfo.user.id
    });

    dbLogger.info('AI analytics alert created via API', {
      alertId,
      type,
      severity,
      companyId,
      createdBy: userInfo.user.id
    });

    return NextResponse.json({
      success: true,
      alertId,
      message: 'Alert created successfully'
    });

  } catch (error) {
    dbLogger.error('Error creating AI analytics alert via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create alert'
    }, { status: 500 });
  }
}

/**
 * PUT /api/ai-analytics/alerts/:id/acknowledge
 * Acknowledge an alert
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const body = await request.json();
    const { acknowledged = true, note, actionTaken } = body;
    const alertId = params.id;

    // Update alert acknowledgment (this would be implemented in the service)
    await updateAlertAcknowledgment(alertId, {
      acknowledged,
      acknowledgedBy: userInfo.user.id,
      acknowledgedAt: new Date(),
      acknowledgmentNote: note,
      actionTaken
    });

    dbLogger.info('AI analytics alert acknowledged via API', {
      alertId,
      userId: userInfo.user.id,
      acknowledged,
      actionTaken: !!actionTaken
    });

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledgment updated'
    });

  } catch (error) {
    dbLogger.error('Error acknowledging AI analytics alert via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to acknowledge alert'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ai-analytics/alerts/:id
 * Dismiss/delete an alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const alertId = params.id;

    // Delete alert (this would be implemented in the service)
    await deleteAlert(alertId, userInfo.user.id);

    dbLogger.info('AI analytics alert dismissed via API', {
      alertId,
      userId: userInfo.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Alert dismissed successfully'
    });

  } catch (error) {
    dbLogger.error('Error dismissing AI analytics alert via API', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to dismiss alert'
    }, { status: 500 });
  }
}

// Helper functions (these would be implemented in the service layer)

async function getActiveAlerts(filters: any) {
  // Mock implementation - would query database
  const mockAlerts = [
    {
      id: '1',
      type: 'bias',
      severity: 'high',
      message: 'Gender bias detected in candidate screening process',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      acknowledged: false,
      companyId: filters.companyId,
      operationType: 'candidate_screening',
      data: {
        biasType: 'gender_bias',
        affectedGroup: 'female',
        disparityRatio: 0.72
      }
    },
    {
      id: '2',
      type: 'performance',
      severity: 'medium',
      message: 'AI model latency exceeded threshold',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      acknowledged: false,
      companyId: filters.companyId,
      operationType: 'resume_processing',
      data: {
        threshold: 2000,
        actualValue: 3500,
        model: 'gemini-2.0-flash'
      }
    },
    {
      id: '3',
      type: 'fairness',
      severity: 'critical',
      message: 'Fairness score below acceptable threshold',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      acknowledged: true,
      acknowledgedBy: 'admin-user-id',
      acknowledgedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      companyId: filters.companyId,
      operationType: 'job_matching',
      data: {
        fairnessScore: 0.65,
        threshold: 0.8,
        affectedGroups: ['age:55+', 'education:high-school']
      }
    }
  ];

  // Apply filters
  let filteredAlerts = mockAlerts;

  if (filters.severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity);
  }

  if (filters.type) {
    filteredAlerts = filteredAlerts.filter(a => a.type === filters.type);
  }

  if (filters.acknowledged !== undefined) {
    filteredAlerts = filteredAlerts.filter(a => a.acknowledged === filters.acknowledged);
  }

  if (filters.companyId) {
    filteredAlerts = filteredAlerts.filter(a => a.companyId === filters.companyId);
  }

  return filteredAlerts.slice(filters.offset, filters.offset + filters.limit);
}

async function createAlert(alertData: any): Promise<string> {
  // Mock implementation - would save to database
  const alertId = 'alert_' + Date.now();
  dbLogger.info('Alert created', { alertId, ...alertData });
  return alertId;
}

async function updateAlertAcknowledgment(alertId: string, acknowledgmentData: any): Promise<void> {
  // Mock implementation - would update database
  dbLogger.info('Alert acknowledgment updated', { alertId, ...acknowledgmentData });
}

async function deleteAlert(alertId: string, userId: string): Promise<void> {
  // Mock implementation - would soft delete from database
  dbLogger.info('Alert dismissed', { alertId, dismissedBy: userId });
}