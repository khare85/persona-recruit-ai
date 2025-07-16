import { NextRequest, NextResponse } from 'next/server';
import { webSocketService } from '@/services/websocket.service';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * WebSocket endpoint for real-time notifications
 * This endpoint provides information about WebSocket connections
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const connectedUsers = webSocketService.getConnectedUsersCount();
    
    return NextResponse.json({
      success: true,
      data: {
        connectedUsers,
        status: 'WebSocket service is running',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Send notification to specific user or company
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { type, target, event, data } = body;

    if (!type || !target || !event || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, target, event, data' },
        { status: 400 }
      );
    }

    let result = false;

    switch (type) {
      case 'user':
        result = webSocketService.sendToUser(target, event, data);
        break;
      case 'company':
        webSocketService.sendToCompany(target, event, data);
        result = true;
        break;
      case 'role':
        webSocketService.sendToRole(target, event, data);
        result = true;
        break;
      case 'broadcast':
        webSocketService.broadcast(event, data);
        result = true;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    apiLogger.info('WebSocket notification sent', {
      type,
      target,
      event,
      result
    });

    return NextResponse.json({
      success: true,
      data: {
        sent: result,
        type,
        target,
        event,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get WebSocket connection status for specific user or company
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { userId, companyId } = body;

    if (userId) {
      const isOnline = webSocketService.isUserOnline(userId);
      const connectionInfo = webSocketService.getUserConnectionInfo(userId);

      return NextResponse.json({
        success: true,
        data: {
          userId,
          isOnline,
          connectionInfo,
          timestamp: Date.now()
        }
      });
    }

    if (companyId) {
      const connectedUsers = webSocketService.getCompanyConnectedUsers(companyId);

      return NextResponse.json({
        success: true,
        data: {
          companyId,
          connectedUsers,
          count: connectedUsers.length,
          timestamp: Date.now()
        }
      });
    }

    return NextResponse.json(
      { error: 'Either userId or companyId is required' },
      { status: 400 }
    );

  } catch (error) {
    return handleApiError(error);
  }
}