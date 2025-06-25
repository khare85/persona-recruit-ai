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

    const alerts = await aiAnalyticsService.getActiveAlerts(filters);

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

    const alertId = await aiAnalyticsService.createAlert({
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
    await aiAnalyticsService.updateAlertAcknowledgment(alertId, {
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
    await aiAnalyticsService.deleteAlert(alertId, userInfo.user.id);

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
