// AI Performance Analytics and Bias Monitoring Types

export interface AIOperationMetric {
  id: string;
  operationType: 'resume_processing' | 'candidate_matching' | 'job_generation' | 
                 'skill_extraction' | 'interview_analysis' | 'talent_search' | 
                 'job_recommendation' | 'candidate_screening';
  
  // Performance Metrics
  executionTimeMs: number;
  inputTokens?: number;
  outputTokens?: number;
  modelUsed: string;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  
  // Quality Metrics
  confidenceScore?: number;
  accuracyScore?: number;
  relevanceScore?: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  
  // Context Data
  userId?: string;
  companyId?: string;
  jobId?: string;
  candidateId?: string;
  applicationId?: string;
  
  // Bias Monitoring Data
  demographicData?: DemographicData;
  biasFlags?: BiasFlag[];
  fairnessScore?: number;
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
}

export interface DemographicData {
  // Note: This data should be anonymized and encrypted
  ageRange?: '18-25' | '26-35' | '36-45' | '46-55' | '55+';
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  ethnicity?: string[]; // Multiple selections allowed
  location?: {
    country: string;
    region?: string;
    city?: string;
  };
  educationLevel?: 'high-school' | 'bachelors' | 'masters' | 'phd' | 'other';
  yearsExperience?: number;
  industryBackground?: string[];
  
  // Privacy flags
  consentGiven: boolean;
  anonymized: boolean;
  encryptionKey?: string;
}

export interface BiasFlag {
  type: 'gender_bias' | 'age_bias' | 'racial_bias' | 'education_bias' | 
        'location_bias' | 'name_bias' | 'experience_bias' | 'language_bias';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  detectedAt: Date;
  affectedGroups: string[];
  suggestedAction?: string;
}

export interface FairnessMetric {
  id: string;
  metricType: 'demographic_parity' | 'equalized_odds' | 'equal_opportunity' | 
             'disparate_impact' | 'statistical_parity';
  
  // Metric Values
  overallScore: number; // 0-1, where 1 is perfectly fair
  groupScores: Record<string, number>; // Scores by demographic group
  threshold: number; // Acceptable fairness threshold
  passed: boolean;
  
  // Analysis Period
  startDate: Date;
  endDate: Date;
  sampleSize: number;
  
  // Context
  operationType: string;
  companyId?: string;
  jobCategory?: string;
  
  // Recommendations
  recommendations?: string[];
  actionItems?: ActionItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  type: 'model_adjustment' | 'data_collection' | 'process_review' | 'training_needed';
  estimatedEffort: 'small' | 'medium' | 'large';
  dueDate?: Date;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

export interface AIPerformanceDashboard {
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Performance Overview
  performance: {
    totalOperations: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
    topErrors: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  
  // Model Usage
  modelUsage: Array<{
    model: string;
    operations: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
  }>;
  
  // Operation Breakdown
  operationStats: Array<{
    type: string;
    count: number;
    successRate: number;
    averageLatency: number;
    averageConfidence: number;
  }>;
  
  // Bias Monitoring
  biasOverview: {
    totalFlags: number;
    criticalFlags: number;
    fairnessScore: number;
    flagsByType: Record<string, number>;
    trendDirection: 'improving' | 'worsening' | 'stable';
  };
  
  // Fairness Metrics
  fairnessMetrics: Array<{
    metric: string;
    score: number;
    status: 'pass' | 'fail' | 'warning';
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Real-time Alerts
  activeAlerts: Array<{
    id: string;
    type: 'performance' | 'bias' | 'error_rate' | 'fairness';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;
}

export interface BiasDetectionRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'statistical' | 'threshold' | 'pattern' | 'ml_model';
  
  // Rule Configuration
  config: {
    operationTypes: string[];
    demographicFields: string[];
    thresholds: Record<string, number>;
    conditions: Array<{
      field: string;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
      value: any;
    }>;
  };
  
  // Rule Status
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  lastTriggered?: Date;
  triggerCount: number;
  
  // Actions
  actions: Array<{
    type: 'alert' | 'flag' | 'block_operation' | 'request_review';
    config: Record<string, any>;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AuditTrail {
  id: string;
  eventType: 'ai_operation' | 'bias_detection' | 'fairness_check' | 
            'model_update' | 'rule_update' | 'alert_acknowledged';
  
  // Event Details
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Related Entities
  userId?: string;
  operationId?: string;
  ruleId?: string;
  metricId?: string;
  
  // Event Data
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  
  // Context
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  timestamp: Date;
}

// Database Collections Schema Extensions
export const AI_ANALYTICS_COLLECTIONS = {
  AI_OPERATION_METRICS: 'aiOperationMetrics',
  FAIRNESS_METRICS: 'fairnessMetrics', 
  BIAS_FLAGS: 'biasFlags',
  BIAS_DETECTION_RULES: 'biasDetectionRules',
  AI_AUDIT_TRAIL: 'aiAuditTrail',
  PERFORMANCE_ALERTS: 'performanceAlerts'
} as const;

// Real-time Analytics Events
export interface AnalyticsEvent {
  type: 'metric_created' | 'bias_detected' | 'alert_triggered' | 
        'fairness_updated' | 'performance_threshold_breached';
  data: any;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  companyId?: string;
}

// Dashboard Filter Options
export interface AnalyticsFilters {
  timeRange: {
    start: Date;
    end: Date;
    preset?: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
  };
  operationTypes?: string[];
  companyIds?: string[];
  models?: string[];
  severityLevels?: string[];
  biasTypes?: string[];
  successOnly?: boolean;
  withDemographics?: boolean;
}

// Export types for easy consumption
export type {
  AIOperationMetric,
  DemographicData,
  BiasFlag,
  FairnessMetric,
  ActionItem,
  AIPerformanceDashboard,
  BiasDetectionRule,
  AuditTrail,
  AnalyticsEvent,
  AnalyticsFilters
};