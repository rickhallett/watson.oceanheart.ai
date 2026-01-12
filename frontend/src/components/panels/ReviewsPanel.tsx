import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CompactCard, CompactCardGrid } from '@/components/CompactCard';
import { MonochromeButton } from '@/components/MonochromeButton';
import { FileText, Clock, CheckCircle, AlertCircle, Edit3, GitCompare, Calendar } from 'lucide-react';

interface Review {
  id: string;
  clientId: string;
  dateSubmitted: string;
  llmVersion: string;
  status: 'pending' | 'in-review' | 'completed';
  editPercentage: number;
  keyChanges: string[];
  clinicianNotes?: string;
}

const mockReviews: Review[] = [
  {
    id: 'R-2024-001',
    clientId: '#2024-1127',
    dateSubmitted: '2024-01-27 14:30',
    llmVersion: 'GPT-4 Turbo',
    status: 'completed',
    editPercentage: 28.5,
    keyChanges: ['Added safety planning', 'Refined diagnosis criteria', 'Expanded treatment goals'],
    clinicianNotes: 'LLM missed important trauma history context'
  },
  {
    id: 'R-2024-002',
    clientId: '#2024-1128',
    dateSubmitted: '2024-01-27 15:45',
    llmVersion: 'Claude 3 Opus',
    status: 'completed',
    editPercentage: 15.2,
    keyChanges: ['Corrected medication names', 'Added cultural considerations'],
    clinicianNotes: 'Generally accurate, minor terminology adjustments'
  },
  {
    id: 'R-2024-003',
    clientId: '#2024-1129',
    dateSubmitted: '2024-01-27 16:20',
    llmVersion: 'GPT-4 Turbo',
    status: 'in-review',
    editPercentage: 42.1,
    keyChanges: ['Currently being edited'],
  },
  {
    id: 'R-2024-004',
    clientId: '#2024-1130',
    dateSubmitted: '2024-01-27 17:00',
    llmVersion: 'Claude 3 Opus',
    status: 'pending',
    editPercentage: 0,
    keyChanges: [],
  },
  {
    id: 'R-2024-005',
    clientId: '#2024-1131',
    dateSubmitted: '2024-01-27 09:15',
    llmVersion: 'GPT-4 Turbo',
    status: 'completed',
    editPercentage: 35.8,
    keyChanges: ['Restructured formulation', 'Added risk assessment', 'Modified intervention approach'],
    clinicianNotes: 'Significant improvements needed in ACT conceptualization'
  }
];

export function ReviewsPanel() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-review' | 'completed'>('all');

  const filteredReviews = filterStatus === 'all' 
    ? mockReviews 
    : mockReviews.filter(r => r.status === filterStatus);

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-zinc-400" />;
      case 'in-review':
        return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return 'text-zinc-400';
      case 'in-review':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">
          LLM Response Reviews
        </h1>
        <p className="text-zinc-400">
          Track and analyze differences between AI-generated assessments and clinical evaluations
        </p>
      </div>

      {/* Stats Overview */}
      <CompactCardGrid columns={4}>
        <CompactCard
          title="Total Reviews"
          metric={mockReviews.length}
          description="This week"
          icon={<FileText className="w-4 h-4" />}
          status="default"
        />
        <CompactCard
          title="Avg Edit Rate"
          metric="27.3%"
          description="Content modified"
          icon={<GitCompare className="w-4 h-4" />}
          status="info"
        />
        <CompactCard
          title="Pending Review"
          metric={mockReviews.filter(r => r.status === 'pending').length}
          description="Awaiting review"
          icon={<Clock className="w-4 h-4" />}
          status="warning"
        />
        <CompactCard
          title="Completed Today"
          metric={mockReviews.filter(r => r.status === 'completed').length}
          description="Reviews finished"
          icon={<CheckCircle className="w-4 h-4" />}
          status="success"
        />
      </CompactCardGrid>

      {/* Filter Tabs */}
      <div className="mt-8 mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'in-review', 'completed'] as const).map((status) => (
            <MonochromeButton
              key={status}
              variant={filterStatus === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All Reviews' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </MonochromeButton>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Review ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  LLM Model
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Edit Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredReviews.map((review) => (
                <motion.tr
                  key={review.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {review.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {review.clientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {review.llmVersion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-2 text-sm ${getStatusColor(review.status)}`}>
                      {getStatusIcon(review.status)}
                      <span className="capitalize">{review.status.replace('-', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-zinc-800 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${review.editPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400">{review.editPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {review.dateSubmitted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MonochromeButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle review action
                      }}
                    >
                      {review.status === 'pending' ? 'Start Review' : 'View Details'}
                    </MonochromeButton>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Review Details */}
      {selectedReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-card p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-zinc-50">
              Review Details - {selectedReview.id}
            </h3>
            <MonochromeButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedReview(null)}
            >
              Close
            </MonochromeButton>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Key Changes</h4>
              {selectedReview.keyChanges.length > 0 ? (
                <ul className="space-y-2">
                  {selectedReview.keyChanges.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                      <span className="text-sm text-zinc-300">{change}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No changes yet</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Clinician Notes</h4>
              {selectedReview.clinicianNotes ? (
                <p className="text-sm text-zinc-300">{selectedReview.clinicianNotes}</p>
              ) : (
                <p className="text-sm text-zinc-500">No notes added</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <MonochromeButton variant="primary" size="md">
              Open in Editor
            </MonochromeButton>
            <MonochromeButton variant="ghost" size="md">
              View Diff
            </MonochromeButton>
            <MonochromeButton variant="ghost" size="md">
              Export Data
            </MonochromeButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}