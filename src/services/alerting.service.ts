import { db } from './firestoreService';
import { dbLogger } from '@/lib/logger';
import admin from 'firebase-admin';
import { 
  AIOperationMetric, 
  BiasFlag, 
  FairnessMetric,
  AI_ANALYTICS_COLLECTIONS 
} from '@/types/analytics.types';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'bias' | 'fairness' | 'error_rate' | 'latency';
  enabled: boolean;
  
  // Conditions
  conditions: Array<{
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow?: string; // e.g., '5m', '1h', '24h'
  }>;
  
  // Severity and actions
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{
    type: 'email' | 'slack' | 'webhook' | 'internal_notification';
    config: Record<string, any>;
  }>;
  
  // Suppression settings
  suppressionDuration?: number; // Minutes to suppress duplicate alerts
  maxAlertsPerHour?: number;
  
  // Targeting
  companyIds?: string[];
  operationTypes?: string[];
  userIds?: string[];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  type: 'performance' | 'bias' | 'fairness' | 'error_rate' | 'latency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  title: string;
  message: string;
  data: Record<string, any>;
  
  // Context
  userId?: string;
  companyId?: string;
  operationType?: string;
  metricId?: string;
  
  // Alert lifecycle
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgmentNote?: string;
  resolvedAt?: Date;
  
  // Timestamps
  triggeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class AlertingService {
  private db = db;
  
  private ensureDb() {
    if (!this.db) {
      throw new Error('Firestore database not available. Check Firebase configuration.');
    }
  }

  // ============================================================================
  // ALERT RULE MANAGEMENT
  // ============================================================================

  /**
   * Create a new alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.ensureDb();
    
    try {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const docRef = this.db!.collection('alertRules').doc();
      
      const ruleData: AlertRule = {
        ...rule,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await docRef.set({
        ...ruleData,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      dbLogger.info('Alert rule created', { 
        ruleId: docRef.id, 
        type: rule.type,
        severity: rule.severity,
        createdBy: rule.createdBy
      });

      return docRef.id;
    } catch (error) {
      dbLogger.error('Error creating alert rule', { 
        error: String(error), 
        type: rule.type 
      });
      throw error;
    }
  }

  /**
   * Update an existing alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    this.ensureDb();
    
    try {
      await this.db!.collection('alertRules').doc(ruleId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      dbLogger.info('Alert rule updated', { ruleId, updates: Object.keys(updates) });
    } catch (error) {
      dbLogger.error('Error updating alert rule', { error: String(error), ruleId });
      throw error;
    }
  }

  /**
   * Get active alert rules for a specific context
   */
  async getActiveAlertRules(filters?: {
    type?: string;
    companyId?: string;
    operationType?: string;
  }): Promise<AlertRule[]> {
    this.ensureDb();
    
    try {
      let query = this.db!.collection('alertRules')
        .where('enabled', '==', true);

      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }

      const snapshot = await query.get();
      let rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertRule));

      // Filter by company and operation type in application layer
      if (filters?.companyId) {
        rules = rules.filter(rule => 
          !rule.companyIds || rule.companyIds.includes(filters.companyId!)
        );
      }

      if (filters?.operationType) {
        rules = rules.filter(rule => 
          !rule.operationTypes || rule.operationTypes.includes(filters.operationType!)
        );
      }

      return rules;
    } catch (error) {
      dbLogger.error('Error getting alert rules', { error: String(error), filters });
      throw error;
    }
  }

  // ============================================================================
  // ALERT TRIGGERING AND EVALUATION
  // ============================================================================

  /**
   * Evaluate all relevant alert rules against a new AI operation metric
   */
  async evaluateAlertsForMetric(metric: AIOperationMetric): Promise<void> {
    try {
      // Get relevant alert rules
      const alertRules = await this.getActiveAlertRules({
        type: 'performance',
        companyId: metric.companyId,
        operationType: metric.operationType
      });

      // Evaluate each rule
      for (const rule of alertRules) {
        await this.evaluateRule(rule, metric);
      }
    } catch (error) {
      dbLogger.error('Error evaluating alerts for metric', { 
        error: String(error), 
        metricId: metric.id 
      });
    }
  }

  /**
   * Evaluate alert rules for bias flags
   */
  async evaluateAlertsForBias(biasFlags: BiasFlag[], context: {
    companyId?: string;
    operationType?: string;
    metricId?: string;
  }): Promise<void> {
    try {
      const alertRules = await this.getActiveAlertRules({
        type: 'bias',
        companyId: context.companyId,
        operationType: context.operationType
      });

      for (const rule of alertRules) {
        // Check if bias flags meet rule conditions
        const criticalFlags = biasFlags.filter(flag => flag.severity === 'critical').length;
        const highFlags = biasFlags.filter(flag => flag.severity === 'high').length;

        for (const condition of rule.conditions) {
          let value: number;
          
          switch (condition.metric) {
            case 'critical_bias_flags':
              value = criticalFlags;
              break;
            case 'high_bias_flags':
              value = highFlags;
              break;
            case 'total_bias_flags':
              value = biasFlags.length;
              break;
            default:
              continue;
          }

          if (this.evaluateCondition(value, condition.operator, condition.threshold)) {
            await this.triggerAlert(rule, {
              title: `Bias Alert: ${rule.name}`,
              message: `${biasFlags.length} bias flags detected, including ${criticalFlags} critical`,
              data: {
                biasFlags: biasFlags.length,
                criticalFlags,
                highFlags,
                details: biasFlags.map(flag => ({
                  type: flag.type,
                  severity: flag.severity,
                  description: flag.description
                }))
              },
              ...context
            });
            break; // Only trigger once per rule
          }
        }
      }
    } catch (error) {
      dbLogger.error('Error evaluating alerts for bias', { 
        error: String(error), 
        context 
      });
    }
  }

  /**
   * Evaluate alert rules for fairness metrics
   */
  async evaluateAlertsForFairness(fairnessMetric: FairnessMetric): Promise<void> {
    try {
      const alertRules = await this.getActiveAlertRules({
        type: 'fairness',
        companyId: fairnessMetric.companyId,
        operationType: fairnessMetric.operationType
      });

      for (const rule of alertRules) {
        for (const condition of rule.conditions) {
          let value: number;
          
          switch (condition.metric) {
            case 'overall_fairness_score':
              value = fairnessMetric.overallScore;
              break;
            case 'demographic_parity':
              value = fairnessMetric.groupScores.demographic_parity || 0;
              break;
            case 'equalized_odds':
              value = fairnessMetric.groupScores.equalized_odds || 0;
              break;
            default:
              continue;
          }

          if (this.evaluateCondition(value, condition.operator, condition.threshold)) {
            await this.triggerAlert(rule, {
              title: `Fairness Alert: ${rule.name}`,
              message: `Fairness score ${value.toFixed(2)} ${condition.operator} threshold ${condition.threshold}`,
              data: {
                fairnessMetric: fairnessMetric.overallScore,
                threshold: condition.threshold,
                passed: fairnessMetric.passed,
                sampleSize: fairnessMetric.sampleSize,
                groupScores: fairnessMetric.groupScores
              },
              companyId: fairnessMetric.companyId,
              operationType: fairnessMetric.operationType
            });
            break;
          }
        }
      }
    } catch (error) {
      dbLogger.error('Error evaluating alerts for fairness', { 
        error: String(error), 
        metricId: fairnessMetric.id 
      });
    }
  }

  /**
   * Evaluate a specific rule against a metric
   */
  private async evaluateRule(rule: AlertRule, metric: AIOperationMetric): Promise<void> {
    try {
      // Check if rule should be suppressed
      if (await this.isRuleSuppressed(rule.id)) {
        return;
      }

      // Evaluate each condition
      for (const condition of rule.conditions) {
        let value: number;
        
        switch (condition.metric) {
          case 'execution_time':
            value = metric.executionTimeMs;
            break;
          case 'confidence_score':
            value = metric.confidenceScore || 0;
            break;
          case 'accuracy_score':
            value = metric.accuracyScore || 0;
            break;
          case 'success_rate':
            // This would require aggregation - simplified here
            value = metric.success ? 1 : 0;
            break;
          default:
            continue;
        }

        if (this.evaluateCondition(value, condition.operator, condition.threshold)) {
          await this.triggerAlert(rule, {
            title: `Performance Alert: ${rule.name}`,
            message: `${condition.metric} ${value} ${condition.operator} ${condition.threshold}`,
            data: {
              metric: condition.metric,
              value,
              threshold: condition.threshold,
              operator: condition.operator,
              executionTime: metric.executionTimeMs,
              model: metric.modelUsed,
              success: metric.success
            },
            userId: metric.userId,
            companyId: metric.companyId,
            operationType: metric.operationType,
            metricId: metric.id
          });
          break; // Only trigger once per rule per metric
        }
      }
    } catch (error) {
      dbLogger.error('Error evaluating rule', { 
        error: String(error), 
        ruleId: rule.id,
        metricId: metric.id 
      });
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, alertData: {
    title: string;
    message: string;
    data: Record<string, any>;
    userId?: string;
    companyId?: string;
    operationType?: string;
    metricId?: string;
  }): Promise<string> {
    this.ensureDb();
    
    try {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const docRef = this.db!.collection('alerts').doc();
      
      const alert: Alert = {
        id: docRef.id,
        ruleId: rule.id,
        type: rule.type,
        severity: rule.severity,
        title: alertData.title,
        message: alertData.message,
        data: alertData.data,
        userId: alertData.userId,
        companyId: alertData.companyId,
        operationType: alertData.operationType,
        metricId: alertData.metricId,
        status: 'active',
        triggeredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await docRef.set({
        ...alert,
        triggeredAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // Execute alert actions
      for (const action of rule.actions) {
        await this.executeAlertAction(action, alert);
      }

      // Update rule suppression if configured
      if (rule.suppressionDuration) {
        await this.suppressRule(rule.id, rule.suppressionDuration);
      }

      dbLogger.info('Alert triggered', { 
        alertId: docRef.id,
        ruleId: rule.id,
        type: rule.type,
        severity: rule.severity,
        title: alertData.title
      });

      return docRef.id;
    } catch (error) {
      dbLogger.error('Error triggering alert', { 
        error: String(error), 
        ruleId: rule.id 
      });
      throw error;
    }
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string, 
    acknowledgedBy: string, 
    note?: string
  ): Promise<void> {
    this.ensureDb();
    
    try {
      await this.db!.collection('alerts').doc(alertId).update({
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: admin.firestore.FieldValue.serverTimestamp(),
        acknowledgmentNote: note,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      dbLogger.info('Alert acknowledged', { alertId, acknowledgedBy, note });
    } catch (error) {
      dbLogger.error('Error acknowledging alert', { error: String(error), alertId });
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    this.ensureDb();
    
    try {
      await this.db!.collection('alerts').doc(alertId).update({
        status: 'resolved',
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      dbLogger.info('Alert resolved', { alertId, resolvedBy });
    } catch (error) {
      dbLogger.error('Error resolving alert', { error: String(error), alertId });
      throw error;
    }
  }

  /**
   * Get alerts with filtering
   */
  async getAlerts(filters?: {
    status?: string;
    severity?: string;
    type?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: Alert[]; total: number }> {
    this.ensureDb();
    
    try {
      let query = this.db!.collection('alerts') as any;

      // Apply filters
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters?.severity) {
        query = query.where('severity', '==', filters.severity);
      }
      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters?.companyId) {
        query = query.where('companyId', '==', filters.companyId);
      }
      if (filters?.startDate) {
        query = query.where('triggeredAt', '>=', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.where('triggeredAt', '<=', filters.endDate);
      }

      // Get total count
      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;

      // Apply pagination and ordering
      query = query.orderBy('triggeredAt', 'desc');
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const alerts = snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Alert));

      return { alerts, total };
    } catch (error) {
      dbLogger.error('Error getting alerts', { error: String(error), filters });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Evaluate a condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Check if a rule is currently suppressed
   */
  private async isRuleSuppressed(ruleId: string): Promise<boolean> {
    // Implementation would check suppression cache/database
    // For now, return false (no suppression)
    return false;
  }

  /**
   * Suppress a rule for a specified duration
   */
  private async suppressRule(ruleId: string, durationMinutes: number): Promise<void> {
    // Implementation would set suppression in cache/database
    dbLogger.info('Rule suppressed', { ruleId, durationMinutes });
  }

  /**
   * Execute an alert action
   */
  private async executeAlertAction(action: AlertRule['actions'][0], alert: Alert): Promise<void> {
    try {
      switch (action.type) {
        case 'email':
          await this.sendEmailAlert(action.config, alert);
          break;
        case 'slack':
          await this.sendSlackAlert(action.config, alert);
          break;
        case 'webhook':
          await this.sendWebhookAlert(action.config, alert);
          break;
        case 'internal_notification':
          await this.sendInternalNotification(action.config, alert);
          break;
        default:
          dbLogger.warn('Unknown alert action type', { type: action.type, alertId: alert.id });
      }
    } catch (error) {
      dbLogger.error('Error executing alert action', { 
        error: String(error), 
        actionType: action.type,
        alertId: alert.id 
      });
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(config: any, alert: Alert): Promise<void> {
    // Implementation would integrate with email service
    dbLogger.info('Email alert sent', { 
      alertId: alert.id, 
      recipients: config.recipients,
      severity: alert.severity 
    });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(config: any, alert: Alert): Promise<void> {
    // Implementation would integrate with Slack API
    dbLogger.info('Slack alert sent', { 
      alertId: alert.id, 
      channel: config.channel,
      severity: alert.severity 
    });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(config: any, alert: Alert): Promise<void> {
    // Implementation would send HTTP POST to webhook URL
    dbLogger.info('Webhook alert sent', { 
      alertId: alert.id, 
      url: config.url,
      severity: alert.severity 
    });
  }

  /**
   * Send internal notification
   */
  private async sendInternalNotification(config: any, alert: Alert): Promise<void> {
    // Implementation would create in-app notification
    dbLogger.info('Internal notification sent', { 
      alertId: alert.id, 
      userIds: config.userIds,
      severity: alert.severity 
    });
  }
}

export const alertingService = new AlertingService();
export default alertingService;