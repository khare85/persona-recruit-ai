'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AnalyticsFilters } from '@/types/analytics.types';
import { Download, FileText, Table, Database } from 'lucide-react';

interface ExportControlsProps {
  filters: AnalyticsFilters;
}

export function ExportControls({ filters }: ExportControlsProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json');
  const [includeRawData, setIncludeRawData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch('/api/ai-analytics/dashboard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          format: exportFormat,
          includeRawData
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `ai-analytics-export.${exportFormat}`;

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <Database className="h-4 w-4" />;
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'xlsx': return <Table className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Analytics Data</DialogTitle>
          <DialogDescription>
            Export the current dashboard data for external analysis or compliance reporting.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>JSON - Machine readable data</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV - Spreadsheet compatible</span>
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4" />
                    <span>Excel - Full formatting</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Options</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRawData"
                  checked={includeRawData}
                  onCheckedChange={(checked) => setIncludeRawData(checked as boolean)}
                />
                <label htmlFor="includeRawData" className="text-sm">
                  Include raw metric data (larger file size)
                </label>
              </div>
            </div>
          </div>

          {/* Current Filters Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Current Filters</h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>
                <span className="font-medium">Time Range:</span>{' '}
                {filters.timeRange.start.toLocaleDateString()} - {filters.timeRange.end.toLocaleDateString()}
              </div>
              {filters.operationTypes && (
                <div>
                  <span className="font-medium">Operations:</span>{' '}
                  {filters.operationTypes.join(', ')}
                </div>
              )}
              {filters.companyIds && (
                <div>
                  <span className="font-medium">Companies:</span>{' '}
                  {filters.companyIds.length} selected
                </div>
              )}
              {filters.models && (
                <div>
                  <span className="font-medium">Models:</span>{' '}
                  {filters.models.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <DialogTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button onClick={handleExport} disabled={isExporting}>
              {getFormatIcon(exportFormat)}
              <span className="ml-2">
                {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}