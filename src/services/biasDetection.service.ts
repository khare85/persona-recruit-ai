import { 
  AIOperationMetric, 
  DemographicData, 
  BiasFlag, 
  FairnessMetric,
  BiasDetectionRule 
} from '@/types/analytics.types';
import { dbLogger } from '@/lib/logger';

export interface BiasAnalysisResult {
  biasDetected: boolean;
  overallFairnessScore: number; // 0-1, where 1 is perfectly fair
  flags: BiasFlag[];
  metrics: {
    demographicParity: number;
    equalizedOdds: number;
    equalOpportunity: number;
    disparateImpact: number;
    statisticalParity: number;
  };
  groupAnalysis: Array<{
    group: string;
    sampleSize: number;
    successRate: number;
    avgScore: number;
    fairnessScore: number;
    recommendations: string[];
  }>;
  recommendations: string[];
}

export interface GroupStats {
  group: string;
  field: string;
  value: string;
  totalCount: number;
  successCount: number;
  successRate: number;
  avgConfidenceScore: number;
  avgAccuracyScore: number;
  avgRelevanceScore: number;
}

class BiasDetectionService {
  
  // ============================================================================
  // MAIN BIAS DETECTION METHODS
  // ============================================================================

  /**
   * Comprehensive bias analysis across multiple fairness metrics
   */
  async analyzeBias(
    metrics: AIOperationMetric[],
    operationType: string,
    minimumSampleSize: number = 30
  ): Promise<BiasAnalysisResult> {
    try {
      dbLogger.info('Starting comprehensive bias analysis', { 
        operationType, 
        sampleSize: metrics.length,
        minimumSampleSize 
      });

      // Filter metrics with demographic data
      const metricsWithDemographics = metrics.filter(m => 
        m.demographicData && 
        m.demographicData.consentGiven && 
        m.success !== undefined
      );

      if (metricsWithDemographics.length < minimumSampleSize) {
        return this.createInsufficientDataResult(metricsWithDemographics.length, minimumSampleSize);
      }

      // Group metrics by demographic characteristics
      const groupStats = this.calculateGroupStatistics(metricsWithDemographics);
      
      // Calculate fairness metrics
      const demographicParity = this.calculateDemographicParity(groupStats);
      const equalizedOdds = this.calculateEqualizedOdds(metricsWithDemographics, groupStats);
      const equalOpportunity = this.calculateEqualOpportunity(metricsWithDemographics, groupStats);
      const disparateImpact = this.calculateDisparateImpact(groupStats);
      const statisticalParity = this.calculateStatisticalParity(groupStats);

      // Calculate overall fairness score
      const overallFairnessScore = this.calculateOverallFairnessScore({
        demographicParity,
        equalizedOdds,
        equalOpportunity,
        disparateImpact,
        statisticalParity
      });

      // Detect bias flags
      const flags = this.generateBiasFlags(groupStats, {
        demographicParity,
        equalizedOdds,
        equalOpportunity,
        disparateImpact,
        statisticalParity
      });

      // Generate group-specific analysis
      const groupAnalysis = this.generateGroupAnalysis(groupStats, overallFairnessScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(overallFairnessScore, flags, groupAnalysis);

      const result: BiasAnalysisResult = {
        biasDetected: flags.length > 0 || overallFairnessScore < 0.8,
        overallFairnessScore,
        flags,
        metrics: {
          demographicParity,
          equalizedOdds,
          equalOpportunity,
          disparateImpact,
          statisticalParity
        },
        groupAnalysis,
        recommendations
      };

      dbLogger.info('Bias analysis completed', { 
        operationType,
        biasDetected: result.biasDetected,
        overallFairnessScore,
        flagCount: flags.length
      });

      return result;
    } catch (error) {
      dbLogger.error('Error in bias analysis', { 
        error: String(error), 
        operationType,
        sampleSize: metrics.length 
      });
      throw error;
    }
  }

  /**
   * Detect name-based bias using linguistic analysis
   */
  async detectNameBias(
    metrics: AIOperationMetric[],
    nameField: string = 'candidateName'
  ): Promise<BiasFlag[]> {
    const flags: BiasFlag[] = [];
    
    try {
      // Group by inferred name characteristics
      const nameGroups = this.groupByNameCharacteristics(metrics, nameField);
      
      // Calculate success rates by name characteristics
      for (const [characteristic, groupMetrics] of Object.entries(nameGroups)) {
        const successRate = groupMetrics.filter(m => m.success).length / groupMetrics.length;
        const overallSuccessRate = metrics.filter(m => m.success).length / metrics.length;
        
        const disparityRatio = successRate / overallSuccessRate;
        
        if (disparityRatio < 0.8 || disparityRatio > 1.25) {
          flags.push({
            type: 'name_bias',
            severity: this.determineSeverity(disparityRatio),
            confidence: this.calculateConfidence(groupMetrics.length, disparityRatio),
            description: `Name-based bias detected for ${characteristic}. Success rate ratio: ${disparityRatio.toFixed(2)}`,
            detectedAt: new Date(),
            affectedGroups: [characteristic],
            suggestedAction: 'Review resume screening process and consider anonymizing names during initial screening'
          });
        }
      }
    } catch (error) {
      dbLogger.error('Error detecting name bias', { error: String(error) });
    }
    
    return flags;
  }

  /**
   * Detect location-based bias
   */
  async detectLocationBias(metrics: AIOperationMetric[]): Promise<BiasFlag[]> {
    const flags: BiasFlag[] = [];
    
    try {
      const locationGroups = this.groupByLocation(metrics);
      const overallSuccessRate = metrics.filter(m => m.success).length / metrics.length;
      
      for (const [location, groupMetrics] of Object.entries(locationGroups)) {
        if (groupMetrics.length < 10) continue; // Skip small samples
        
        const successRate = groupMetrics.filter(m => m.success).length / groupMetrics.length;
        const disparityRatio = successRate / overallSuccessRate;
        
        if (disparityRatio < 0.8) {
          flags.push({
            type: 'location_bias',
            severity: this.determineSeverity(disparityRatio),
            confidence: this.calculateConfidence(groupMetrics.length, disparityRatio),
            description: `Location-based bias detected for ${location}. Success rate: ${(successRate * 100).toFixed(1)}%`,
            detectedAt: new Date(),
            affectedGroups: [location],
            suggestedAction: 'Review if location requirements are job-relevant and consider remote work options'
          });
        }
      }
    } catch (error) {
      dbLogger.error('Error detecting location bias', { error: String(error) });
    }
    
    return flags;
  }

  /**
   * Detect age-based bias using statistical analysis
   */
  async detectAgeBias(metrics: AIOperationMetric[]): Promise<BiasFlag[]> {
    const flags: BiasFlag[] = [];
    
    try {
      const ageGroups = this.groupByAgeRange(metrics);
      const overallSuccessRate = metrics.filter(m => m.success).length / metrics.length;
      
      // Check for age discrimination patterns
      for (const [ageRange, groupMetrics] of Object.entries(ageGroups)) {
        if (groupMetrics.length < 5) continue;
        
        const successRate = groupMetrics.filter(m => m.success).length / groupMetrics.length;
        const disparityRatio = successRate / overallSuccessRate;
        
        // Special attention to age extremes (younger and older workers)
        const isExtremeAge = ageRange === '18-25' || ageRange === '55+';
        const threshold = isExtremeAge ? 0.75 : 0.8;
        
        if (disparityRatio < threshold) {
          flags.push({
            type: 'age_bias',
            severity: disparityRatio < 0.6 ? 'critical' : disparityRatio < 0.75 ? 'high' : 'medium',
            confidence: this.calculateConfidence(groupMetrics.length, disparityRatio),
            description: `Potential age discrimination for ${ageRange} age group. Success rate: ${(successRate * 100).toFixed(1)}%`,
            detectedAt: new Date(),
            affectedGroups: [ageRange],
            suggestedAction: 'Review job requirements and screening criteria to ensure age-neutral evaluation'
          });
        }
      }

      // Check for systematic age bias across all groups
      const ageRangeOrder = ['18-25', '26-35', '36-45', '46-55', '55+'];
      const successRatesByAge = ageRangeOrder.map(range => ({
        range,
        rate: ageGroups[range] ? 
          ageGroups[range].filter(m => m.success).length / ageGroups[range].length : 0
      }));

      // Look for monotonic decline in success rates with age
      if (this.detectMonotonicTrend(successRatesByAge.map(a => a.rate))) {
        flags.push({
          type: 'age_bias',
          severity: 'high',
          confidence: 0.85,
          description: 'Systematic age bias detected: success rates decline with age',
          detectedAt: new Date(),
          affectedGroups: ageRangeOrder,
          suggestedAction: 'Comprehensive review of age-related screening criteria and potential implicit bias'
        });
      }
    } catch (error) {
      dbLogger.error('Error detecting age bias', { error: String(error) });
    }
    
    return flags;
  }

  // ============================================================================
  // FAIRNESS METRICS CALCULATIONS
  // ============================================================================

  /**
   * Calculate demographic parity (equal positive rates across groups)
   */
  private calculateDemographicParity(groupStats: GroupStats[]): number {
    if (groupStats.length < 2) return 1.0;
    
    const successRates = groupStats.map(g => g.successRate);
    const minRate = Math.min(...successRates);
    const maxRate = Math.max(...successRates);
    
    // Return the ratio of minimum to maximum success rate
    return maxRate > 0 ? minRate / maxRate : 1.0;
  }

  /**
   * Calculate equalized odds (equal TPR and FPR across groups)
   * Note: This is simplified - would need ground truth labels for full implementation
   */
  private calculateEqualizedOdds(
    metrics: AIOperationMetric[], 
    groupStats: GroupStats[]
  ): number {
    // Simplified calculation using confidence scores as proxy
    // In production, this would require actual positive/negative labels
    
    const groupConfidenceVariances = groupStats.map(group => {
      const groupMetrics = metrics.filter(m => 
        this.getGroupKey(m.demographicData!) === group.group
      );
      
      const confidenceScores = groupMetrics
        .map(m => m.confidenceScore || 0)
        .filter(score => score > 0);
      
      if (confidenceScores.length === 0) return 0;
      
      const mean = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
      const variance = confidenceScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / confidenceScores.length;
      
      return variance;
    });
    
    const maxVariance = Math.max(...groupConfidenceVariances);
    const minVariance = Math.min(...groupConfidenceVariances);
    
    // Higher variance differences indicate less equalized odds
    return maxVariance > 0 ? 1 - (maxVariance - minVariance) / maxVariance : 1.0;
  }

  /**
   * Calculate equal opportunity (equal TPR for positive class across groups)
   */
  private calculateEqualOpportunity(
    metrics: AIOperationMetric[], 
    groupStats: GroupStats[]
  ): number {
    // Simplified implementation using high-confidence positive predictions
    const groupOpportunityRates = groupStats.map(group => {
      const groupMetrics = metrics.filter(m => 
        this.getGroupKey(m.demographicData!) === group.group
      );
      
      const highConfidencePositives = groupMetrics.filter(m => 
        m.success && (m.confidenceScore || 0) > 0.8
      );
      
      const totalPositives = groupMetrics.filter(m => m.success);
      
      return totalPositives.length > 0 ? 
        highConfidencePositives.length / totalPositives.length : 0;
    });
    
    const minRate = Math.min(...groupOpportunityRates);
    const maxRate = Math.max(...groupOpportunityRates);
    
    return maxRate > 0 ? minRate / maxRate : 1.0;
  }

  /**
   * Calculate disparate impact (80% rule)
   */
  private calculateDisparateImpact(groupStats: GroupStats[]): number {
    if (groupStats.length < 2) return 1.0;
    
    const successRates = groupStats.map(g => g.successRate);
    const maxRate = Math.max(...successRates);
    const minRate = Math.min(...successRates);
    
    // 80% rule: minority group rate should be at least 80% of majority group rate
    return maxRate > 0 ? minRate / maxRate : 1.0;
  }

  /**
   * Calculate statistical parity
   */
  private calculateStatisticalParity(groupStats: GroupStats[]): number {
    return this.calculateDemographicParity(groupStats); // Same calculation
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate group statistics for demographic analysis
   */
  private calculateGroupStatistics(metrics: AIOperationMetric[]): GroupStats[] {
    const groups: Record<string, AIOperationMetric[]> = {};
    
    // Group metrics by demographic characteristics
    metrics.forEach(metric => {
      if (!metric.demographicData) return;
      
      const demographicKeys = this.extractDemographicKeys(metric.demographicData);
      
      demographicKeys.forEach(key => {
        if (!groups[key]) groups[key] = [];
        groups[key].push(metric);
      });
    });
    
    // Calculate statistics for each group
    return Object.entries(groups)
      .filter(([_, groupMetrics]) => groupMetrics.length >= 5) // Minimum sample size
      .map(([groupKey, groupMetrics]) => {
        const [field, value] = groupKey.split(':');
        const successCount = groupMetrics.filter(m => m.success).length;
        
        return {
          group: groupKey,
          field,
          value,
          totalCount: groupMetrics.length,
          successCount,
          successRate: successCount / groupMetrics.length,
          avgConfidenceScore: this.calculateAverage(groupMetrics, 'confidenceScore'),
          avgAccuracyScore: this.calculateAverage(groupMetrics, 'accuracyScore'),
          avgRelevanceScore: this.calculateAverage(groupMetrics, 'relevanceScore')
        };
      });
  }

  /**
   * Extract demographic keys for grouping
   */
  private extractDemographicKeys(demographics: DemographicData): string[] {
    const keys: string[] = [];
    
    if (demographics.gender) keys.push(`gender:${demographics.gender}`);
    if (demographics.ageRange) keys.push(`age:${demographics.ageRange}`);
    if (demographics.ethnicity) demographics.ethnicity.forEach(e => keys.push(`ethnicity:${e}`));
    if (demographics.educationLevel) keys.push(`education:${demographics.educationLevel}`);
    if (demographics.location?.country) keys.push(`country:${demographics.location.country}`);
    if (demographics.location?.region) keys.push(`region:${demographics.location.region}`);
    
    return keys;
  }

  /**
   * Get group key for a demographic data object
   */
  private getGroupKey(demographics: DemographicData): string {
    // Use primary demographic identifier
    if (demographics.gender) return `gender:${demographics.gender}`;
    if (demographics.ageRange) return `age:${demographics.ageRange}`;
    if (demographics.ethnicity && demographics.ethnicity.length > 0) return `ethnicity:${demographics.ethnicity[0]}`;
    if (demographics.educationLevel) return `education:${demographics.educationLevel}`;
    return 'unknown';
  }

  /**
   * Calculate overall fairness score from individual metrics
   */
  private calculateOverallFairnessScore(metrics: {
    demographicParity: number;
    equalizedOdds: number;
    equalOpportunity: number;
    disparateImpact: number;
    statisticalParity: number;
  }): number {
    const weights = {
      demographicParity: 0.25,
      equalizedOdds: 0.25,
      equalOpportunity: 0.2,
      disparateImpact: 0.2,
      statisticalParity: 0.1
    };
    
    return (
      metrics.demographicParity * weights.demographicParity +
      metrics.equalizedOdds * weights.equalizedOdds +
      metrics.equalOpportunity * weights.equalOpportunity +
      metrics.disparateImpact * weights.disparateImpact +
      metrics.statisticalParity * weights.statisticalParity
    );
  }

  /**
   * Generate bias flags based on fairness metrics
   */
  private generateBiasFlags(
    groupStats: GroupStats[], 
    fairnessMetrics: any
  ): BiasFlag[] {
    const flags: BiasFlag[] = [];
    
    // Flag groups with low fairness scores
    groupStats.forEach(group => {
      if (group.successRate < 0.6) {
        flags.push({
          type: this.determineBiasType(group.field),
          severity: 'high',
          confidence: this.calculateConfidence(group.totalCount, group.successRate),
          description: `Low success rate (${(group.successRate * 100).toFixed(1)}%) for ${group.group}`,
          detectedAt: new Date(),
          affectedGroups: [group.group],
          suggestedAction: this.generateActionForGroup(group)
        });
      }
    });
    
    // Flag low overall fairness metrics
    Object.entries(fairnessMetrics).forEach(([metric, score]) => {
      if (typeof score === 'number' && score < 0.7) {
        flags.push({
          type: 'statistical_parity' as any,
          severity: score < 0.5 ? 'critical' : score < 0.6 ? 'high' : 'medium',
          confidence: 0.9,
          description: `Low ${metric} score: ${score.toFixed(2)}`,
          detectedAt: new Date(),
          affectedGroups: groupStats.map(g => g.group),
          suggestedAction: `Review and improve ${metric} across all demographic groups`
        });
      }
    });
    
    return flags;
  }

  /**
   * Generate group-specific analysis
   */
  private generateGroupAnalysis(
    groupStats: GroupStats[], 
    overallFairnessScore: number
  ): BiasAnalysisResult['groupAnalysis'] {
    return groupStats.map(group => ({
      group: group.group,
      sampleSize: group.totalCount,
      successRate: group.successRate,
      avgScore: (group.avgConfidenceScore + group.avgAccuracyScore + group.avgRelevanceScore) / 3,
      fairnessScore: Math.min(group.successRate / 0.8, 1.0), // Normalized to 80% baseline
      recommendations: this.generateGroupRecommendations(group, overallFairnessScore)
    }));
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(
    overallFairnessScore: number,
    flags: BiasFlag[],
    groupAnalysis: any[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallFairnessScore < 0.6) {
      recommendations.push('CRITICAL: Immediate comprehensive bias audit required');
      recommendations.push('Suspend automated decisions until bias issues are resolved');
      recommendations.push('Implement human oversight for all AI-driven decisions');
    } else if (overallFairnessScore < 0.8) {
      recommendations.push('Conduct thorough review of training data for demographic representation');
      recommendations.push('Implement bias testing in model validation pipeline');
      recommendations.push('Consider fairness constraints in model optimization');
    }
    
    // Add specific recommendations based on flags
    const flagTypes = [...new Set(flags.map(f => f.type))];
    flagTypes.forEach(type => {
      switch (type) {
        case 'gender_bias':
          recommendations.push('Review gender-neutral language in job descriptions and screening criteria');
          break;
        case 'age_bias':
          recommendations.push('Ensure age-related requirements are job-relevant and legally compliant');
          break;
        case 'racial_bias':
          recommendations.push('Audit training data for racial representation and historical bias');
          break;
        case 'education_bias':
          recommendations.push('Evaluate if education requirements are essential for job performance');
          break;
        case 'location_bias':
          recommendations.push('Consider remote work options and location-neutral evaluation criteria');
          break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Additional helper methods...
  private calculateAverage(metrics: AIOperationMetric[], field: keyof AIOperationMetric): number {
    const values = metrics.map(m => m[field] as number).filter(v => typeof v === 'number' && v > 0);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private determineBiasType(field: string): BiasFlag['type'] {
    switch (field) {
      case 'gender': return 'gender_bias';
      case 'age': return 'age_bias';
      case 'ethnicity': return 'racial_bias';
      case 'education': return 'education_bias';
      case 'country':
      case 'region': return 'location_bias';
      default: return 'statistical_parity' as any;
    }
  }

  private determineSeverity(disparityRatio: number): BiasFlag['severity'] {
    if (disparityRatio < 0.5 || disparityRatio > 2.0) return 'critical';
    if (disparityRatio < 0.7 || disparityRatio > 1.43) return 'high';
    if (disparityRatio < 0.8 || disparityRatio > 1.25) return 'medium';
    return 'low';
  }

  private calculateConfidence(sampleSize: number, effect: number): number {
    // Simple confidence calculation based on sample size and effect size
    const sizeConfidence = Math.min(sampleSize / 100, 1.0);
    const effectConfidence = Math.abs(effect - 1.0);
    return Math.min(sizeConfidence * effectConfidence, 1.0);
  }

  private generateActionForGroup(group: GroupStats): string {
    return `Review screening criteria and training data representation for ${group.field} group`;
  }

  private generateGroupRecommendations(group: GroupStats, overallScore: number): string[] {
    const recommendations: string[] = [];
    
    if (group.successRate < 0.7) {
      recommendations.push(`Investigate low success rate for ${group.group}`);
      recommendations.push(`Review training data representation for ${group.field}`);
    }
    
    if (group.avgConfidenceScore < 0.6) {
      recommendations.push(`Improve model confidence for ${group.group} predictions`);
    }
    
    return recommendations;
  }

  private createInsufficientDataResult(actualSize: number, minimumSize: number): BiasAnalysisResult {
    return {
      biasDetected: false,
      overallFairnessScore: 1.0,
      flags: [],
      metrics: {
        demographicParity: 1.0,
        equalizedOdds: 1.0,
        equalOpportunity: 1.0,
        disparateImpact: 1.0,
        statisticalParity: 1.0
      },
      groupAnalysis: [],
      recommendations: [
        `Insufficient data for bias analysis (${actualSize} samples, need ${minimumSize})`,
        'Collect more demographic data with user consent to enable bias monitoring',
        'Implement systematic demographic data collection in AI operations'
      ]
    };
  }

  // Specialized grouping methods
  private groupByNameCharacteristics(metrics: AIOperationMetric[], nameField: string): Record<string, AIOperationMetric[]> {
    // This would use linguistic analysis to infer name characteristics
    // Simplified implementation
    return { 'common_names': metrics, 'uncommon_names': [] };
  }

  private groupByLocation(metrics: AIOperationMetric[]): Record<string, AIOperationMetric[]> {
    const groups: Record<string, AIOperationMetric[]> = {};
    
    metrics.forEach(metric => {
      if (metric.demographicData?.location?.country) {
        const country = metric.demographicData.location.country;
        if (!groups[country]) groups[country] = [];
        groups[country].push(metric);
      }
    });
    
    return groups;
  }

  private groupByAgeRange(metrics: AIOperationMetric[]): Record<string, AIOperationMetric[]> {
    const groups: Record<string, AIOperationMetric[]> = {};
    
    metrics.forEach(metric => {
      if (metric.demographicData?.ageRange) {
        const ageRange = metric.demographicData.ageRange;
        if (!groups[ageRange]) groups[ageRange] = [];
        groups[ageRange].push(metric);
      }
    });
    
    return groups;
  }

  private detectMonotonicTrend(values: number[]): boolean {
    if (values.length < 3) return false;
    
    let decreasing = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i-1]) decreasing++;
    }
    
    // Consider monotonic if >60% of transitions are decreasing
    return decreasing / (values.length - 1) > 0.6;
  }
}

export const biasDetectionService = new BiasDetectionService();
export default biasDetectionService;