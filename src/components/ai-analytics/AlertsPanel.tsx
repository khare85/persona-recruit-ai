'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Clock, Eye, X, MessageSquare } from 'lucide-react';

interface Alert {
  id: string;
  type: 'performance' | 'bias' | 'fairness' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  companyId?: string;
  operationType?: string;
  data?: Record<string, any>;
}

interface AlertsPanelProps {
  alerts: Alert[];
  loading: boolean;
  onRefresh: () => void;
}

export function AlertsPanel({ alerts, loading, onRefresh }: AlertsPanelProps) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [acknowledgmentNote, setAcknowledgmentNote] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bias': return 'bg-purple-100 text-purple-800';
      case 'fairness': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-orange-100 text-orange-800';
      case 'error_rate': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'acknowledged') return alert.acknowledged;
    return alert.severity === filter;
  });

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ai-analytics/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledged: true,
          note: acknowledgmentNote
        })
      });

      if (response.ok) {
        onRefresh();
        setSelectedAlert(null);
        setAcknowledgmentNote('');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ai-analytics/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alert Management
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onRefresh} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.severity === 'critical').length}
              </p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {alerts.filter(a => a.severity === 'high').length}
              </p>
              <p className="text-sm text-muted-foreground">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.severity === 'medium').length}
              </p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => !a.acknowledged).length}
              </p>
              <p className="text-sm text-muted-foreground">Unacknowledged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'All systems are operating normally'
                  : `No alerts match the current filter: ${filter}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-l-red-500' :
              alert.severity === 'high' ? 'border-l-orange-500' :
              alert.severity === 'medium' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getSeverityColor(alert.severity) as any} className="flex items-center space-x-1">
                        {getSeverityIcon(alert.severity)}
                        <span>{alert.severity.toUpperCase()}</span>
                      </Badge>
                      <Badge variant="outline" className={getTypeColor(alert.type)}>
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {alert.acknowledged && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-medium mb-2">{alert.message}</h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {alert.timestamp.toLocaleString()}
                      </span>
                      {alert.operationType && (
                        <span>Operation: {alert.operationType}</span>
                      )}
                      {alert.acknowledgedBy && (
                        <span>
                          Acknowledged by: {alert.acknowledgedBy}
                        </span>
                      )}
                    </div>

                    {alert.data && Object.keys(alert.data).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Additional Details:</p>
                        <div className="text-sm space-y-1">
                          {Object.entries(alert.data).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium capitalize mr-2">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.acknowledged && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Acknowledge Alert</DialogTitle>
                            <DialogDescription>
                              Add a note about how this alert was resolved or what action was taken.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Acknowledgment Note (Optional)
                              </label>
                              <Textarea
                                value={acknowledgmentNote}
                                onChange={(e) => setAcknowledgmentNote(e.target.value)}
                                placeholder="Describe what action was taken to address this alert..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedAlert(null);
                                  setAcknowledgmentNote('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={() => handleAcknowledge(alert.id)}>
                                Acknowledge Alert
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(alert.id)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}