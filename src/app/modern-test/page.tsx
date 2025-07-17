/**
 * Modern Components Test Page
 * Test the new modern design system components
 */

'use client';

import { useState } from 'react';
import { Users, Briefcase, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import { 
  ModernCard, 
  ModernMetricCard, 
  ModernButton, 
  ModernBadge,
  ModernGrid,
  ModernContainer,
  ModernHeader
} from '@/components/ui/modern-design-system';

export default function ModernTestPage() {
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <ModernContainer>
        <ModernHeader
          title="Modern Design System Test"
          subtitle="Testing all the new modern components"
          actions={
            <>
              <ModernButton variant="secondary" leftIcon={Settings}>
                Settings
              </ModernButton>
              <ModernButton leftIcon={Users}>
                Add User
              </ModernButton>
            </>
          }
        />

        <div className="space-y-8">
          {/* Metric Cards */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Metric Cards</h2>
            <ModernGrid cols={4}>
              <ModernMetricCard
                title="Total Users"
                value="12,847"
                subtitle="3,924 active"
                icon={Users}
                color="primary"
                trend={{ value: 8, isPositive: true }}
              />
              <ModernMetricCard
                title="Active Jobs"
                value="1,847"
                icon={Briefcase}
                color="success"
                trend={{ value: 12, isPositive: true }}
              />
              <ModernMetricCard
                title="Growth Rate"
                value="23%"
                icon={TrendingUp}
                color="warning"
                trend={{ value: 5, isPositive: false }}
              />
              <ModernMetricCard
                title="System Alerts"
                value="3"
                icon={AlertTriangle}
                color="error"
                trend={{ value: 2, isPositive: false }}
              />
            </ModernGrid>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <ModernButton 
                variant="primary" 
                size="lg" 
                leftIcon={Users}
                onClick={handleButtonClick}
                loading={loading}
              >
                Primary Button
              </ModernButton>
              <ModernButton variant="secondary" size="lg">
                Secondary Button
              </ModernButton>
              <ModernButton variant="ghost" size="lg">
                Ghost Button
              </ModernButton>
              <ModernButton variant="destructive" size="lg">
                Destructive Button
              </ModernButton>
            </div>
          </section>

          {/* Badges */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Badges</h2>
            <div className="flex flex-wrap gap-4">
              <ModernBadge variant="success" icon={Users}>
                Active
              </ModernBadge>
              <ModernBadge variant="warning">
                Warning
              </ModernBadge>
              <ModernBadge variant="error">
                Error
              </ModernBadge>
              <ModernBadge variant="info">
                Info
              </ModernBadge>
              <ModernBadge variant="neutral">
                Neutral
              </ModernBadge>
            </div>
          </section>

          {/* Cards */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cards</h2>
            <ModernGrid cols={3}>
              <ModernCard variant="default" padding="md">
                <h3 className="font-semibold text-neutral-900 mb-2">Default Card</h3>
                <p className="text-neutral-600">This is a default card with medium padding.</p>
              </ModernCard>
              <ModernCard variant="elevated" padding="lg">
                <h3 className="font-semibold text-neutral-900 mb-2">Elevated Card</h3>
                <p className="text-neutral-600">This is an elevated card with large padding.</p>
              </ModernCard>
              <ModernCard variant="bordered" padding="sm" interactive>
                <h3 className="font-semibold text-neutral-900 mb-2">Interactive Card</h3>
                <p className="text-neutral-600">This is an interactive card with small padding.</p>
              </ModernCard>
            </ModernGrid>
          </section>

          {/* Status Test */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Status Test</h2>
            <ModernCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">System Status</h3>
                  <p className="text-sm text-neutral-600">All systems operational</p>
                </div>
                <ModernBadge variant="success" icon={Users}>
                  Healthy
                </ModernBadge>
              </div>
            </ModernCard>
          </section>
        </div>
      </ModernContainer>
    </div>
  );
}