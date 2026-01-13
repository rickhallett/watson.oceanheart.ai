import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompactCard, CompactCardGrid } from '@/components/CompactCard';
import { MonochromeButton } from '@/components/MonochromeButton';
import {
  BarChart3,
  TrendingUp,
  Brain,
  FileText,
  Users,
  Clock,
  GitCompare,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { fetchAnalytics, type AnalyticsData, handleApiError } from '@/utils/api';

interface EditPattern {
  category: string;
  frequency: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  examples: string[];
}

interface ModelPerformance {
  model: string;
  totalReviews: number;
  avgEditRate: number;
  commonIssues: string[];
  strengths: string[];
}

// Transform API labels to edit patterns
function transformLabelsToPatterns(labels: AnalyticsData['common_labels']): EditPattern[] {
  return labels.map((label, index) => ({
    category: label.label_name || 'Unknown',
    frequency: label.count,
    percentage: label.percentage,
    trend: index < 2 ? 'up' : index > labels.length - 2 ? 'down' : 'stable',
    examples: [],
  }));
}

// Transform API model data to model performance
function transformModelsToPerformance(models: AnalyticsData['edits_by_model']): ModelPerformance[] {
  return models.map(model => ({
    model: model.model_name,
    totalReviews: model.count,
    avgEditRate: model.avg_change_rate,
    commonIssues: [],
    strengths: [],
  }));
}

export function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedPattern, setSelectedPattern] = useState<EditPattern | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics from API
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAnalytics(timeRange);
        setAnalytics(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [timeRange]);

  // Transform API data to component formats
  const editPatterns = analytics ? transformLabelsToPatterns(analytics.common_labels) : [];
  const modelPerformance = analytics ? transformModelsToPerformance(analytics.edits_by_model) : [];
  const criticalIssues = Object.entries(analytics?.edits_by_status || {})
    .filter(([status]) => status === 'rejected')
    .reduce((acc, [, count]) => acc + (count as number), 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">
          Research Analytics
        </h1>
        <p className="text-zinc-400">
          Patterns and insights from LLM response evaluations
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <MonochromeButton
            key={range}
            variant={timeRange === range ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
          </MonochromeButton>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <span className="ml-3 text-zinc-400">Loading analytics...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-card p-6 border-red-500/50">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Error loading analytics: {error}</span>
          </div>
          <MonochromeButton
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </MonochromeButton>
        </div>
      )}

      {/* Key Metrics */}
      {!loading && !error && (
        <CompactCardGrid columns={4}>
          <CompactCard
            title="Total Assessments"
            metric={analytics?.total_edits.toString() || '0'}
            description={`${timeRange} period`}
            icon={<FileText className="w-4 h-4" />}
            status="default"
          />
          <CompactCard
            title="Average Edit Rate"
            metric={`${analytics?.average_edit_rate || 0}%`}
            description="Content modified"
            icon={<GitCompare className="w-4 h-4" />}
            status="default"
            trend="up"
          />
          <CompactCard
            title="Critical Issues"
            metric={criticalIssues.toString()}
            description="Rejected edits"
            icon={<AlertTriangle className="w-4 h-4" />}
            status="error"
          />
          <CompactCard
            title="Pattern Detection"
            metric={editPatterns.length.toString()}
            description="Labels tracked"
            icon={<Brain className="w-4 h-4" />}
            status="success"
            trend="up"
          />
        </CompactCardGrid>
      )}

      {/* Empty State */}
      {!loading && !error && analytics?.total_edits === 0 && (
        <div className="mt-8 glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No data yet</h3>
          <p className="text-zinc-500">Analytics will appear here once reviews are created</p>
        </div>
      )}

      {/* Edit Patterns Analysis */}
      {!loading && !error && editPatterns.length > 0 && (
      <div className="mt-8 glass-card p-6">
        <h2 className="text-xl font-semibold text-zinc-50 mb-4">
          Common Edit Patterns
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Most frequently modified sections in LLM responses
        </p>
        
        <div className="space-y-4">
          {editPatterns.map((pattern) => (
            <motion.div
              key={pattern.category}
              className="border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPattern(pattern)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-zinc-200">{pattern.category}</h3>
                  {pattern.trend === 'up' && (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  )}
                  {pattern.trend === 'stable' && (
                    <Info className="w-4 h-4 text-blue-400" />
                  )}
                  {pattern.trend === 'down' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-400">
                    {pattern.frequency} occurrences
                  </span>
                  <span className="text-sm font-medium text-zinc-300">
                    {pattern.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${pattern.percentage}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

      {/* Selected Pattern Details */}
      {selectedPattern && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-card p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-zinc-50">
              Pattern Details: {selectedPattern.category}
            </h3>
            <MonochromeButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPattern(null)}
            >
              Close
            </MonochromeButton>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-400 mb-3">Common examples of this edit pattern:</p>
            {selectedPattern.examples.map((example, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                <span className="text-sm text-zinc-300">{example}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Model Performance Comparison */}
      {!loading && !error && modelPerformance.length > 0 && (
      <div className="mt-8 glass-card p-6">
        <h2 className="text-xl font-semibold text-zinc-50 mb-4">
          LLM Model Performance
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Comparative analysis of different language models
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Reviews
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Avg Edit Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {modelPerformance.map((model) => (
                <tr key={model.model} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-4 text-sm text-zinc-300 font-medium">
                    {model.model}
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-400">
                    {model.totalReviews}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-zinc-800 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${model.avgEditRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400">{model.avgEditRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Export Section */}
      {!loading && !error && (
      <div className="mt-8 glass-card p-6">
        <h2 className="text-xl font-semibold text-zinc-50 mb-4">
          Export Research Data
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Download analyzed data for further research and pattern analysis
        </p>
        <div className="flex gap-3">
          <MonochromeButton variant="primary" size="md">
            Export Dataset (CSV)
          </MonochromeButton>
          <MonochromeButton variant="ghost" size="md">
            Generate Report (PDF)
          </MonochromeButton>
          <MonochromeButton variant="ghost" size="md">
            Export Raw Data (JSON)
          </MonochromeButton>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Note: Pattern analysis by AI is coming soon. Current data represents manual clinical review findings.
        </p>
      </div>
      )}
    </div>
  );
}