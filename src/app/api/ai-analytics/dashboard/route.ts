import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyticsService } from '@/services/aiAnalytics.service';
import { biasDetectionService } from '@/services/biasDetection.service';
import { AnalyticsFilters } from '@/types/analytics.types';
import { dbLogger } from '@/lib/logger';
import { verifyUserRole } from '@/utils/auth';

/**
 * GET /api/ai-analytics/dashboard
 * Retrieve comprehensive AI performance and bias monitoring dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Extract user info and verify permissions
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const timeRange = {
      start: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: 7 days ago
      end: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date(),
      preset: searchParams.get('preset') as any
    };

    const filters: AnalyticsFilters = {
      timeRange,
      operationTypes: searchParams.get('operationTypes')?.split(','),
      companyIds: userInfo.user.role === 'admin' ? 
        searchParams.get('companyIds')?.split(',') : 
        [userInfo.user.companyId].filter(Boolean),
      models: searchParams.get('models')?.split(','),
      severityLevels: searchParams.get('severityLevels')?.split(','),
      biasTypes: searchParams.get('biasTypes')?.split(','),
      successOnly: searchParams.get('successOnly') === 'true',
      withDemographics: searchParams.get('withDemographics') === 'true'
    };

    // Get dashboard data
    const dashboardData = await aiAnalyticsService.getDashboardData(filters);

    dbLogger.info('AI analytics dashboard data retrieved', {
      userId: userInfo.user.id,
      role: userInfo.user.role,
      companyId: userInfo.user.companyId,
      timeRange: filters.timeRange,
      filtersApplied: Object.keys(filters).filter(key => 
        filters[key as keyof AnalyticsFilters] !== undefined
      ).length
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      filters,
      metadata: {
        generatedAt: new Date().toISOString(),
        userRole: userInfo.user.role,
        companyId: userInfo.user.companyId
      }
    });

  } catch (error) {
    dbLogger.error('Error retrieving AI analytics dashboard data', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/ai-analytics/dashboard/export
 * Export dashboard data in various formats
 */
export async function POST(request: NextRequest) {
  try {
    const userInfo = await verifyUserRole(request, ['admin', 'company_admin']);
    if (!userInfo.success) {
      return NextResponse.json({ error: userInfo.error }, { status: 401 });
    }

    const body = await request.json();
    const { filters, format = 'json', includeRawData = false } = body;

    // Get dashboard data
    const dashboardData = await aiAnalyticsService.getDashboardData(filters);

    // Format data based on requested format
    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'csv':
        exportData = await convertToCSV(dashboardData, includeRawData);
        contentType = 'text/csv';
        filename = `ai-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'xlsx':
        exportData = await convertToExcel(dashboardData, includeRawData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `ai-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      
      default:
        exportData = JSON.stringify(dashboardData, null, 2);
        contentType = 'application/json';
        filename = `ai-analytics-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    dbLogger.info('AI analytics data exported', {
      userId: userInfo.user.id,
      format,
      includeRawData,
      companyId: userInfo.user.companyId
    });

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    dbLogger.error('Error exporting AI analytics data', {
      error: String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to export dashboard data'
    }, { status: 500 });
  }
}

// Helper functions for data conversion
async function convertToCSV(data: any, includeRawData: boolean): Promise<string> {
  // Basic CSV conversion - would use a proper library in production
  const rows = [];
  
  // Header
  rows.push(['Metric', 'Value', 'Timestamp'].join(','));
  
  // Performance data
  rows.push(['Total Operations', data.performance.totalOperations, new Date().toISOString()].join(','));
  rows.push(['Success Rate', data.performance.successRate, new Date().toISOString()].join(','));
  rows.push(['Average Latency', data.performance.averageLatency, new Date().toISOString()].join(','));
  rows.push(['Error Rate', data.performance.errorRate, new Date().toISOString()].join(','));
  
  // Bias overview
  rows.push(['Total Bias Flags', data.biasOverview.totalFlags, new Date().toISOString()].join(','));
  rows.push(['Critical Flags', data.biasOverview.criticalFlags, new Date().toISOString()].join(','));
  rows.push(['Fairness Score', data.biasOverview.fairnessScore, new Date().toISOString()].join(','));
  
  return rows.join('\n');
}

async function convertToExcel(data: any, includeRawData: boolean): Promise<Buffer> {
  // Would use a library like xlsx or exceljs in production
  // For now, return CSV data as buffer
  const csvData = await convertToCSV(data, includeRawData);
  return Buffer.from(csvData, 'utf8');
}