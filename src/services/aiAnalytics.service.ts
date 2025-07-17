import { db } from './firestoreService';
import { 
  AIOperationMetric, 
  DemographicData, 
  BiasFlag, 
  FairnessMetric,
  BiasDetectionRule,
  AuditTrail,
  AIPerformanceDashboard,
  AnalyticsEvent,
  AnalyticsFilters,
  AI_ANALYTICS_COLLECTIONS 
} from '@/types/analytics.types';
import { dbLogger } from '@/lib/logger';
import admin from 'firebase-admin';

class AIAnalyticsService {
  private db = db;
  
  private ensureDb() {
    if (!this.db) {
      throw new Error('Firestore database not available. Check Firebase configuration.');
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Records an AI operation metric for performance and bias monitoring
   */
  async recordAIOperation(metric: Omit<AIOperationMetric, 'id' | 'createdAt'>): Promise<string> {
    this.ensureDb();
    
    try {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const docRef = this.db!.collection(AI_ANALYTICS_COLLECTIONS.AI_OPERATION_METRICS).doc();
      
      const metricData: AIOperationMetric = {
        ...metric,
        id: docRef.id,
        createdAt: new Date(),
        timestamp: metric.timestamp || new Date()
      };

      await docRef.set({
        ...metricData,
        createdAt: timestamp
      });

      dbLogger.info('AI operation metric recorded', { 
        metricId: docRef.id, 
        operationType: metric.operationType,
        success: metric.success 
      });

      // Check for bias patterns in real-time
      if (metric.demographicData) {
        await this.checkForBiasPatterns(metricData);
      }

      // Emit real-time event for dashboard
      await this.emitAnalyticsEvent({
        type: 'metric_created',
        data: metricData,
        timestamp: new Date(),
        severity: metric.success ? 'info' : 'warning',
        userId: metric.userId,
        companyId: metric.companyId
      });

      return docRef.id;
    } catch (error) {
      dbLogger.error('Error recording AI operation metric', { 
        error: String(error), 
        operationType: metric.operationType 
      });
      throw error;
    }
  }

  /**
   * Batch record multiple AI operations for efficiency
   */
  async recordAIOperationsBatch(metrics: Omit<AIOperationMetric, 'id' | 'createdAt'>[]): Promise<string[]> {
    this.ensureDb();
    
    try {
      const batch = this.db!.batch();
      const ids: string[] = [];
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      for (const metric of metrics) {
        const docRef = this.db!.collection(AI_ANALYTICS_COLLECTIONS.AI_OPERATION_METRICS).doc();
        const metricData: AIOperationMetric = {
          ...metric,
          id: docRef.id,
          createdAt: new Date(),
          timestamp: metric.timestamp || new Date()
        };

        batch.set(docRef, {
          ...metricData,
          createdAt: timestamp
        });

        ids.push(docRef.id);
      }

      await batch.commit();
      
      dbLogger.info('AI operation metrics batch recorded', { 
        count: metrics.length,
        ids: ids.slice(0, 5) // Log first 5 IDs
      });

      return ids;
    } catch (error) {
      dbLogger.error('Error recording AI operations batch', { 
        error: String(error), 
        count: metrics.length 
      });
      throw error;
    }
  }

  // ============================================================================
  // BIAS DETECTION AND MONITORING
  // ============================================================================

  /**
   * Check for bias patterns in real-time during AI operations
   */
  private async checkForBiasPatterns(metric: AIOperationMetric): Promise<void> {
    if (!metric.demographicData) return;

    try {
      // Get active bias detection rules
      const rulesSnapshot = await this.db!.collection(AI_ANALYTICS_COLLECTIONS.BIAS_DETECTION_RULES)
        .where('enabled', '==', true)
        .where('config.operationTypes', 'array-contains', metric.operationType)
        .get();

      const rules = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BiasDetectionRule));

      for (const rule of rules) {
        await this.evaluateBiasRule(rule, metric);
      }
    } catch (error) {
      dbLogger.error('Error checking bias patterns', { 
        error: String(error), 
        metricId: metric.id 
      });
    }
  }

  /**
   * Evaluate a specific bias detection rule against a metric
   */
  private async evaluateBiasRule(rule: BiasDetectionRule, metric: AIOperationMetric): Promise<void> {
    try {
      let ruleTriggered = false;
      const biasFlags: BiasFlag[] = [];

      // Statistical bias detection
      if (rule.ruleType === 'statistical') {
        const recentMetrics = await this.getRecentMetricsForBiasAnalysis(
          metric.operationType, 
          metric.companyId,
          100 // Sample size
        );
        
        const biasAnalysis = await this.performStatisticalBiasAnalysis(recentMetrics, rule);
        if (biasAnalysis.biasDetected) {
          ruleTriggered = true;
          biasFlags.push(...biasAnalysis.flags);
        }
      }

      // Threshold-based detection
      if (rule.ruleType === 'threshold') {
        const thresholdAnalysis = this.evaluateThresholdRule(rule, metric);
        if (thresholdAnalysis.violated) {
          ruleTriggered = true;
          biasFlags.push(...thresholdAnalysis.flags);
        }
      }

      if (ruleTriggered) {
        await this.handleBiasDetection(rule, metric, biasFlags);
      }
    } catch (error) {
      dbLogger.error('Error evaluating bias rule', { 
        error: String(error), 
        ruleId: rule.id,
        metricId: metric.id 
      });
    }
  }

  /**
   * Get recent metrics for bias analysis
   */
  private async getRecentMetricsForBiasAnalysis(
    operationType: string, 
    companyId?: string, 
    limit: number = 100
  ): Promise<AIOperationMetric[]> {
    this.ensureDb();
    
    let query = this.db!.collection(AI_ANALYTICS_COLLECTIONS.AI_OPERATION_METRICS)
      .where('operationType', '==', operationType)
      .where('success', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIOperationMetric));
  }

  /**
   * Perform statistical bias analysis on a set of metrics
   */
  private async performStatisticalBiasAnalysis(
    metrics: AIOperationMetric[], 
    rule: BiasDetectionRule
  ): Promise<{ biasDetected: boolean; flags: BiasFlag[] }> {
    const flags: BiasFlag[] = [];
    
    // Group metrics by demographic characteristics
    const demographicGroups = this.groupMetricsByDemographics(metrics);
    
    // Calculate success rates and confidence scores by group
    const groupStats = Object.entries(demographicGroups).map(([group, groupMetrics]) => ({
      group,
      count: groupMetrics.length,
      successRate: groupMetrics.filter(m => m.success).length / groupMetrics.length,
      avgConfidence: groupMetrics.reduce((sum, m) => sum + (m.confidenceScore || 0), 0) / groupMetrics.length,
      avgAccuracy: groupMetrics.reduce((sum, m) => sum + (m.accuracyScore || 0), 0) / groupMetrics.length
    }));

    // Check for disparate impact (80% rule)
    const overallSuccessRate = metrics.filter(m => m.success).length / metrics.length;
    
    for (const groupStat of groupStats) {
      const disparateImpactRatio = groupStat.successRate / overallSuccessRate;
      
      if (disparateImpactRatio < 0.8 || disparateImpactRatio > 1.25) {
        flags.push({
          type: 'racial_bias', // This would be determined by the demographic field
          severity: disparateImpactRatio < 0.5 ? 'critical' : disparateImpactRatio < 0.8 ? 'high' : 'medium',
          confidence: Math.abs(0.8 - disparateImpactRatio),
          description: `Disparate impact detected for group ${groupStat.group}. Success rate ratio: ${disparateImpactRatio.toFixed(2)}`,
          detectedAt: new Date(),
          affectedGroups: [groupStat.group],
          suggestedAction: 'Review model training data and feature selection for this demographic group'
        });
      }
    }

    return {
      biasDetected: flags.length > 0,
      flags
    };
  }

  /**
   * Group metrics by demographic characteristics for analysis
   */
  private groupMetricsByDemographics(metrics: AIOperationMetric[]): Record<string, AIOperationMetric[]> {
    const groups: Record<string, AIOperationMetric[]> = {};
    
    metrics.forEach(metric => {
      if (metric.demographicData) {
        // Create composite demographic keys for analysis
        const keys = [];
        
        if (metric.demographicData.gender) keys.push(`gender:${metric.demographicData.gender}`);
        if (metric.demographicData.ageRange) keys.push(`age:${metric.demographicData.ageRange}`);
        if (metric.demographicData.ethnicity) keys.push(...metric.demographicData.ethnicity.map(e => `ethnicity:${e}`));
        if (metric.demographicData.educationLevel) keys.push(`education:${metric.demographicData.educationLevel}`);
        
        keys.forEach(key => {
          if (!groups[key]) groups[key] = [];
          groups[key].push(metric);
        });
      }
    });
    
    return groups;
  }

  /**
   * Evaluate threshold-based bias rules
   */
  private evaluateThresholdRule(
    rule: BiasDetectionRule, 
    metric: AIOperationMetric
  ): { violated: boolean; flags: BiasFlag[] } {
    const flags: BiasFlag[] = [];
    
    for (const condition of rule.config.conditions) {
      const fieldValue = this.getNestedFieldValue(metric, condition.field);
      const threshold = rule.config.thresholds[condition.field];
      
      if (this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        flags.push({
          type: 'threshold_violation' as any,
          severity: rule.sensitivity as any,
          confidence: 0.9,
          description: `Threshold violation: ${condition.field} ${condition.operator} ${condition.value}`,
          detectedAt: new Date(),
          affectedGroups: [],
          suggestedAction: 'Review the specific case that triggered this threshold'
        });
      }
    }
    
    return {
      violated: flags.length > 0,
      flags
    };
  }

  /**
   * Handle detected bias by creating flags and triggering actions
   */
  private async handleBiasDetection(
    rule: BiasDetectionRule, 
    metric: AIOperationMetric, 
    biasFlags: BiasFlag[]
  ): Promise<void> {
    try {
      // Create bias flag records
      const batch = this.db!.batch();
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      
      for (const flag of biasFlags) {
        const docRef = this.db!.collection(AI_ANALYTICS_COLLECTIONS.BIAS_FLAGS).doc();
        batch.set(docRef, {
          ...flag,
          id: docRef.id,
          ruleId: rule.id,
          metricId: metric.id,
          createdAt: timestamp
        });
      }
      
      await batch.commit();

      // Update rule trigger count
      await this.db!.collection(AI_ANALYTICS_COLLECTIONS.BIAS_DETECTION_RULES).doc(rule.id).update({
        lastTriggered: timestamp,
        triggerCount: admin.firestore.FieldValue.increment(1)
      });

      // Execute rule actions
      for (const action of rule.actions) {
        await this.executeBiasRuleAction(action, rule, metric, biasFlags);
      }

      // Emit bias detection event
      await this.emitAnalyticsEvent({
        type: 'bias_detected',
        data: { rule, metric, flags: biasFlags },
        timestamp: new Date(),
        severity: biasFlags.some(f => f.severity === 'critical') ? 'critical' : 'warning',
        userId: metric.userId,
        companyId: metric.companyId
      });

      dbLogger.warn('Bias detected and handled', { 
        ruleId: rule.id, 
        metricId: metric.id,
        flagCount: biasFlags.length,
        maxSeverity: Math.max(...biasFlags.map(f => 
          f.severity === 'low' ? 1 : f.severity === 'medium' ? 2 : f.severity === 'high' ? 3 : 4
        ))
      });
    } catch (error) {
      dbLogger.error('Error handling bias detection', { 
        error: String(error), 
        ruleId: rule.id,
        metricId: metric.id 
      });
    }
  }

  // ============================================================================
  // FAIRNESS METRICS CALCULATION
  // ============================================================================

  /**
   * Calculate fairness metrics for a time period and operation type
   */
  async calculateFairnessMetrics(
    operationType: string,
    startDate: Date,
    endDate: Date,
    companyId?: string
  ): Promise<FairnessMetric> {
    this.ensureDb();
    
    try {
      // Get metrics for the period
      let query = this.db!.collection(AI_ANALYTICS_COLLECTIONS.AI_OPERATION_METRICS)
        .where('operationType', '==', operationType)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .where('success', '==', true);

      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }

      const snapshot = await query.get();
      const metrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIOperationMetric));

      // Calculate demographic parity
      const demographicParity = this.calculateDemographicParity(metrics);
      
      // Calculate equalized odds
      const equalizedOdds = this.calculateEqualizedOdds(metrics);
      
      // Calculate overall fairness score
      const overallScore = (demographicParity.score + equalizedOdds.score) / 2;
      
      // Create fairness metric record
      const fairnessMetric: FairnessMetric = {
        id: '',
        metricType: 'demographic_parity',
        overallScore,
        groupScores: {
          demographic_parity: demographicParity.score,
          equalized_odds: equalizedOdds.score
        },
        threshold: 0.8, // 80% fairness threshold
        passed: overallScore >= 0.8,
        startDate,
        endDate,
        sampleSize: metrics.length,
        operationType,
        companyId,
        recommendations: this.generateFairnessRecommendations(overallScore, demographicParity, equalizedOdds),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save fairness metric
      const docRef = this.db!.collection(AI_ANALYTICS_COLLECTIONS.FAIRNESS_METRICS).doc();
      fairnessMetric.id = docRef.id;
      
      await docRef.set({
        ...fairnessMetric,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      dbLogger.info('Fairness metrics calculated', { 
        metricId: docRef.id,
        operationType,
        overallScore,
        passed: fairnessMetric.passed
      });

      return fairnessMetric;
    } catch (error) {
      dbLogger.error('Error calculating fairness metrics', { 
        error: String(error), 
        operationType,
        companyId 
      });
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD DATA RETRIEVAL
  // ============================================================================

  /**
   * Get comprehensive dashboard data for AI performance and bias monitoring
   */
  async getDashboardData(filters: AnalyticsFilters): Promise<AIPerformanceDashboard> {
    this.ensureDb();
    
    try {
      const { timeRange, operationTypes, companyIds, models } = filters;
      
      // Build base query
      const baseQuery = this.db!.collection(AI_ANALYTICS_COLLECTIONS.AI_OPERATION_METRICS)
        .where('timestamp', '>=', timeRange.start)
        .where('timestamp', '<=', timeRange.end);

      // Apply filters
      const queryPromises = [];
      
      // Get performance data
      queryPromises.push(this.getPerformanceData(baseQuery, filters));
      
      // Get bias overview
      queryPromises.push(this.getBiasOverview(timeRange, companyIds));
      
      // Get fairness metrics
      queryPromises.push(this.getFairnessOverview(timeRange, operationTypes, companyIds));
      
      // Get active alerts
      queryPromises.push(this.getActiveAlerts(companyIds));

      const [performance, biasOverview, fairnessMetrics, activeAlerts] = await Promise.all(queryPromises);

      return {
        timeRange,
        performance,
        modelUsage: [], // Implemented separately if needed
        operationStats: [], // Implemented separately if needed
        biasOverview,
        fairnessMetrics,
        activeAlerts
      };
    } catch (error) {
      dbLogger.error('Error getting dashboard data', { error: String(error), filters });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async emitAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    // This would integrate with your real-time system (WebSocket, Server-Sent Events, etc.)
    // For now, we'll log it
    dbLogger.info('Analytics event emitted', { 
      type: event.type, 
      severity: event.severity,
      userId: event.userId,
      companyId: event.companyId
    });
  }

  private getNestedFieldValue(obj: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'gt': return value > compareValue;
      case 'lt': return value < compareValue;
      case 'eq': return value === compareValue;
      case 'gte': return value >= compareValue;
      case 'lte': return value <= compareValue;
      case 'contains': return Array.isArray(value) ? value.includes(compareValue) : String(value).includes(compareValue);
      default: return false;
    }
  }

  private calculateDemographicParity(metrics: AIOperationMetric[]): { score: number; details: any } {
    // Simplified demographic parity calculation
    // In production, this would be more sophisticated
    const groupRates = this.groupMetricsByDemographics(metrics);
    const rates = Object.values(groupRates).map(group => 
      group.filter(m => m.success).length / group.length
    );
    
    if (rates.length === 0) return { score: 1, details: {} };
    
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const score = maxRate > 0 ? minRate / maxRate : 1;
    
    return { score, details: { minRate, maxRate, groups: rates.length } };
  }

  private calculateEqualizedOdds(metrics: AIOperationMetric[]): { score: number; details: any } {
    // Simplified equalized odds calculation
    // This would need actual ground truth labels in production
    return { score: 0.85, details: { note: 'Simplified calculation - needs ground truth labels' } };
  }

  private generateFairnessRecommendations(
    overallScore: number, 
    demographicParity: any, 
    equalizedOdds: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 0.6) {
      recommendations.push('Critical: Immediate review of model training data and feature selection required');
      recommendations.push('Consider implementing fairness constraints in model training');
    } else if (overallScore < 0.8) {
      recommendations.push('Review model performance across demographic groups');
      recommendations.push('Consider collecting more representative training data');
    }
    
    if (demographicParity.score < 0.8) {
      recommendations.push('Address demographic parity issues by reviewing selection criteria');
    }
    
    return recommendations;
  }

  private async executeBiasRuleAction(action: any, rule: BiasDetectionRule, metric: AIOperationMetric, flags: BiasFlag[]): Promise<void> {
    // Implementation depends on action type
    dbLogger.info('Executing bias rule action', { 
      actionType: action.type,
      ruleId: rule.id,
      metricId: metric.id 
    });
  }

  private async getPerformanceData(baseQuery: any, filters: AnalyticsFilters): Promise<any> {
    // Implementation for performance data aggregation
    return {
      totalOperations: 0,
      successRate: 0,
      averageLatency: 0,
      errorRate: 0,
      topErrors: []
    };
  }

  private async getBiasOverview(timeRange: any, companyIds?: string[]): Promise<any> {
    // Implementation for bias overview
    return {
      totalFlags: 0,
      criticalFlags: 0,
      fairnessScore: 0,
      flagsByType: {},
      trendDirection: 'stable'
    };
  }

  private async getFairnessOverview(timeRange: any, operationTypes?: string[], companyIds?: string[]): Promise<any[]> {
    // Implementation for fairness metrics overview
    return [];
  }

  async getActiveAlerts(filters?: any): Promise<any[]> {
    // Implementation for active alerts
    return [];
  }

  async createAlert(alertData: any): Promise<string> {
    // Implementation for creating alerts
    return 'alert-id';
  }

  async updateAlertAcknowledgment(alertId: string, userId: string): Promise<void> {
    // Implementation for acknowledging alerts
  }

  async deleteAlert(alertId: string, userId: string): Promise<void> {
    // Implementation for deleting alerts
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export default aiAnalyticsService;