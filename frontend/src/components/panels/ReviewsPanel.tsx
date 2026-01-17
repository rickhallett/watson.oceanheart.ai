import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CompactCard, CompactCardGrid } from '@/components/CompactCard';
import { MonochromeButton } from '@/components/MonochromeButton';
import { FileText, Clock, CheckCircle, AlertCircle, Edit3, GitCompare, Calendar, Loader2 } from 'lucide-react';
import { fetchEdits, type Edit, handleApiError } from '@/utils/api';

interface Review {
  id: string;
  editId: string; // Actual UUID for navigation
  clientId: string;
  dateSubmitted: string;
  llmVersion: string;
  status: 'pending' | 'in-review' | 'completed';
  editPercentage: number;
  keyChanges: string[];
  clinicianNotes?: string;
}

// Map API Edit status to Review status
function mapStatus(apiStatus: Edit['status']): Review['status'] {
  switch (apiStatus) {
    case 'draft':
    case 'in_review':
      return 'pending';
    case 'submitted':
      return 'in-review';
    case 'approved':
    case 'rejected':
      return 'completed';
    default:
      return 'pending';
  }
}

// Transform API Edit to frontend Review
function transformEdit(edit: Edit): Review {
  // structural_diff can be an empty object {} or an array
  const structuralDiff = Array.isArray(edit.structural_diff) ? edit.structural_diff : [];

  return {
    id: `R-${edit.id.slice(0, 8)}`,
    editId: edit.id, // Keep full UUID for navigation
    clientId: edit.llm_output?.document_id ? `#${edit.llm_output.document_id.slice(0, 8)}` : 'N/A',
    dateSubmitted: new Date(edit.created_at).toLocaleString(),
    llmVersion: edit.llm_output?.model_name || 'Unknown',
    status: mapStatus(edit.status),
    editPercentage: edit.diff_stats?.change_rate || 0,
    keyChanges: structuralDiff.map((d: Record<string, unknown>) =>
      `${d.operation}: ${d.path}` || 'Modified content'
    ),
    clinicianNotes: edit.editor_notes || undefined,
  };
}

export function ReviewsPanel() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-review' | 'completed'>('all');

  // Navigate to edit view
  const handleOpenEdit = (editId: string) => {
    navigate(`/app/edit/${editId}`);
  };

  // Fetch edits from API
  useEffect(() => {
    async function loadEdits() {
      try {
        setLoading(true);
        setError(null);
        const edits = await fetchEdits();
        const transformedReviews = edits.map(transformEdit);
        setReviews(transformedReviews);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
    loadEdits();
  }, []);

  const filteredReviews = filterStatus === 'all'
    ? reviews
    : reviews.filter(r => r.status === filterStatus);

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
    <div className="max-w-7xl mx-auto p-6" data-testid="reviews-panel">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50 mb-2" data-testid="reviews-header">
          LLM Response Reviews
        </h1>
        <p className="text-zinc-400">
          Track and analyze differences between AI-generated assessments and clinical evaluations
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <span className="ml-3 text-zinc-400">Loading reviews...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-card p-6 border-red-500/50">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading reviews: {error}</span>
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

      {/* Stats Overview */}
      {!loading && !error && (
        <CompactCardGrid columns={4}>
          <CompactCard
            title="Total Reviews"
            metric={reviews.length}
            description="All time"
            icon={<FileText className="w-4 h-4" />}
            status="default"
          />
          <CompactCard
            title="Avg Edit Rate"
            metric={`${reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.editPercentage, 0) / reviews.length).toFixed(1) : '0'}%`}
            description="Content modified"
            icon={<GitCompare className="w-4 h-4" />}
            status="default"
          />
          <CompactCard
            title="Pending Review"
            metric={reviews.filter(r => r.status === 'pending').length}
            description="Awaiting review"
            icon={<Clock className="w-4 h-4" />}
            status="warning"
          />
          <CompactCard
            title="Completed"
            metric={reviews.filter(r => r.status === 'completed').length}
            description="Reviews finished"
            icon={<CheckCircle className="w-4 h-4" />}
            status="success"
          />
        </CompactCardGrid>
      )}

      {/* Filter Tabs */}
      {!loading && !error && (
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
      )}

      {/* Empty State */}
      {!loading && !error && reviews.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No reviews yet</h3>
          <p className="text-zinc-500 mb-6">Start by creating your first LLM output review</p>
          <MonochromeButton variant="primary" size="md">
            Create Review
          </MonochromeButton>
        </div>
      )}

      {/* Reviews Table */}
      {!loading && !error && reviews.length > 0 && (
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
                        handleOpenEdit(review.editId);
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
      )}

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
            <MonochromeButton
              variant="primary"
              size="md"
              onClick={() => handleOpenEdit(selectedReview.editId)}
            >
              Open in Editor
            </MonochromeButton>
            <MonochromeButton
              variant="ghost"
              size="md"
              onClick={() => handleOpenEdit(selectedReview.editId)}
            >
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