import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { hrIntegrationService } from '@/services/integrations/hrIntegrationService';
import crypto from 'crypto';

/**
 * POST /api/integrations/hr-systems/webhooks - Handle HR system webhooks
 * This endpoint receives webhooks from various HR systems
 */
export const POST = withRateLimit('webhook', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.text();
    const payload = JSON.parse(body);
    
    // Get webhook metadata from headers
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-hub-signature-256');
    const systemType = req.headers.get('x-hr-system') || req.nextUrl.searchParams.get('system');
    const configId = req.headers.get('x-config-id') || req.nextUrl.searchParams.get('configId');

    apiLogger.info('Received HR system webhook', {
      systemType,
      configId,
      hasSignature: !!signature,
      payloadSize: body.length
    });

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Verify webhook signature if provided
    if (signature) {
      const isValid = await verifyWebhookSignature(body, signature, configId);
      if (!isValid) {
        apiLogger.warn('Invalid webhook signature', { configId, signature });
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Process the webhook
    await hrIntegrationService.handleWebhook(configId, payload);

    apiLogger.info('HR webhook processed successfully', {
      configId,
      systemType
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    apiLogger.error('Failed to process HR webhook', {
      error: String(error),
      url: req.url
    });
    
    // Return 200 to prevent webhook retries for non-recoverable errors
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed'
    }, { status: 200 });
  }
});

/**
 * Verify webhook signature
 */
async function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  configId: string
): Promise<boolean> {
  try {
    // TODO: Get webhook secret from integration configuration
    // const config = await databaseService.getHRIntegration(configId);
    // const secret = config?.webhookSecret;
    
    // For now, use a placeholder secret
    const secret = process.env.HR_WEBHOOK_SECRET || 'default-secret';
    
    // Handle different signature formats
    let expectedSignature: string;
    
    if (signature.startsWith('sha256=')) {
      // GitHub/BambooHR style
      const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      expectedSignature = `sha256=${hash}`;
    } else if (signature.startsWith('sha1=')) {
      // Legacy format
      const hash = crypto.createHmac('sha1', secret).update(payload).digest('hex');
      expectedSignature = `sha1=${hash}`;
    } else {
      // Direct hash
      expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  } catch (error) {
    apiLogger.error('Webhook signature verification failed', {
      configId,
      error: String(error)
    });
    return false;
  }
}