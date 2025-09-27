import React, { useState } from 'react';
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
  Info
} from 'lucide-react';

interface EditPattern {
  category: string;
  frequency: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  examples: string[];
}

const editPatterns: EditPattern[] = [
  {
    category: 'Safety Planning',
    frequency: 87,
    percentage: 68.5,
    trend: 'up',
    examples: ['Missing crisis intervention', 'Incomplete risk assessment', 'No emergency contacts']
  },
  {
    category: 'Cultural Factors',
    frequency: 72,
    percentage: 56.7,
    trend: 'up',
    examples: ['Lack of cultural context', 'Missing family dynamics', 'Absent spiritual considerations']
  },
  {
    category: 'Clinical Terminology',
    frequency: 64,
    percentage: 50.4,
    trend: 'stable',
    examples: ['Incorrect DSM-5 criteria', 'Imprecise clinical language', 'Wrong medication names']
  },
  {
    category: 'Treatment History',
    frequency: 45,
    percentage: 35.4,
    trend: 'down',
    examples: ['Missing prior interventions', 'Incomplete medication history', 'No previous diagnoses']
  },
  {
    category: 'ACT Conceptualization',
    frequency: 41,
    percentage: 32.3,
    trend: 'up',
    examples: ['Values not clearly identified', 'Missing psychological flexibility assessment', 'Weak committed action plans']
  }
];

interface ModelPerformance {
  model: string;
  totalReviews: number;
  avgEditRate: number;
  commonIssues: string[];
  strengths: string[];
}

const modelPerformance: ModelPerformance[] = [
  {
    model: 'GPT-4 Turbo',
    totalReviews: 89,
    avgEditRate: 31.2,
    commonIssues: ['Overgeneralization', 'Missing context', 'Weak safety planning'],
    strengths: ['Good structure', 'Clear language', 'Comprehensive assessments']
  },
  {
    model: 'Claude 3 Opus',
    totalReviews: 67,
    avgEditRate: 24.8,
    commonIssues: ['Too verbose', 'Complex terminology', 'Limited cultural awareness'],
    strengths: ['Detailed analysis', 'Strong theoretical grounding', 'Accurate diagnoses']
  },
  {
    model: 'Gemini Pro',
    totalReviews: 21,
    avgEditRate: 38.5,
    commonIssues: ['Inconsistent formatting', 'Missing key details', 'Weak formulations'],
    strengths: ['Concise summaries', 'Good rapport notes', 'Clear goals']
  }
];

export function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedPattern, setSelectedPattern] = useState<EditPattern | null>(null);

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

      {/* Key Metrics */}
      <CompactCardGrid columns={4}>
        <CompactCard
          title="Total Assessments"
          metric="156"
          description={`${timeRange} period`}
          icon={<FileText className="w-4 h-4" />}
          status="default"
        />
        <CompactCard
          title="Average Edit Rate"
          metric="31.8%"
          description="Content modified"
          icon={<GitCompare className="w-4 h-4" />}
          status="info"
          trend="up"
        />
        <CompactCard
          title="Critical Issues"
          metric="23"
          description="Safety concerns"
          icon={<AlertTriangle className="w-4 h-4" />}
          status="error"
        />
        <CompactCard
          title="Pattern Detection"
          metric="12"
          description="New patterns found"
          icon={<Brain className="w-4 h-4" />}
          status="success"
          trend="up"
        />
      </CompactCardGrid>

      {/* Edit Patterns Analysis */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Common Issues
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Strengths
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
                  <td className="px-4 py-4 text-xs text-red-400">
                    {model.commonIssues.join(', ')}
                  </td>
                  <td className="px-4 py-4 text-xs text-green-400">
                    {model.strengths.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
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
    </div>
  );
}