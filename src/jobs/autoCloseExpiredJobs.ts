import { jobStatusService } from '@/services/jobStatusService';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

/**
 * Background job to automatically close expired jobs
 * This should be run periodically (e.g., every hour)
 */
export async function autoCloseExpiredJobs(): Promise<void> {
  try {
    addSentryBreadcrumb('Starting auto-close expired jobs job', 'job', 'info');
    
    await jobStatusService.autoCloseExpiredJobs();
    
    apiLogger.info('Auto-close expired jobs job completed successfully');
    
  } catch (error) {
    apiLogger.error('Auto-close expired jobs job failed', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Re-throw to ensure job is marked as failed
    throw error;
  }
}

// Export for scheduled execution
export const jobConfig = {
  name: 'autoCloseExpiredJobs',
  schedule: '0 * * * *', // Run every hour
  handler: autoCloseExpiredJobs
};