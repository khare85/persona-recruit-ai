'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsFilters } from '@/types/analytics.types';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimeRangeSelectorProps {
  timeRange: AnalyticsFilters['timeRange'];
  onChange: (timeRange: AnalyticsFilters['timeRange']) => void;
}

export function TimeRangeSelector({ timeRange, onChange }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presetRanges = [
    { label: 'Last hour', value: '1h', ms: 60 * 60 * 1000 },
    { label: 'Last 24 hours', value: '24h', ms: 24 * 60 * 60 * 1000 },
    { label: 'Last 7 days', value: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: 'Last 30 days', value: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Last 90 days', value: '90d', ms: 90 * 24 * 60 * 60 * 1000 },
  ];

  const handlePresetChange = (preset: string) => {
    const range = presetRanges.find(r => r.value === preset);
    if (range) {
      const end = new Date();
      const start = new Date(end.getTime() - range.ms);
      onChange({
        start,
        end,
        preset: preset as any
      });
    }
  };

  const handleCustomRange = (start: Date, end: Date) => {
    onChange({
      start,
      end,
      preset: 'custom'
    });
    setIsOpen(false);
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Time Range</label>
      <div className="flex space-x-2">
        <Select
          value={timeRange.preset || 'custom'}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-40">
            <Clock className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presetRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {timeRange.start ? (
                <>
                  {format(timeRange.start, 'MMM dd')} - {format(timeRange.end, 'MMM dd')}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Start Date</label>
                  <Calendar
                    mode="single"
                    selected={timeRange.start}
                    onSelect={(date) => {
                      if (date) {
                        handleCustomRange(date, timeRange.end);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">End Date</label>
                  <Calendar
                    mode="single"
                    selected={timeRange.end}
                    onSelect={(date) => {
                      if (date) {
                        handleCustomRange(timeRange.start, date);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || 
                      date < new Date('1900-01-01') ||
                      date < timeRange.start
                    }
                    initialFocus
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {timeRange.start && timeRange.end && (
        <div className="mt-2 text-xs text-muted-foreground">
          {format(timeRange.start, 'PPP')} - {format(timeRange.end, 'PPP')}
        </div>
      )}
    </div>
  );
}