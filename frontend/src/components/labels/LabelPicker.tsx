import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Plus, Loader2 } from 'lucide-react';
import { MonochromeButton } from '@/components/MonochromeButton';
import {
  fetchLabels,
  fetchEditLabels,
  applyLabel,
  removeLabel,
  type Label,
  type EditLabel,
  handleApiError,
} from '@/utils/api';

interface LabelPickerProps {
  editId: string;
  disabled?: boolean;
}

export function LabelPicker({ editId, disabled = false }: LabelPickerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [appliedLabels, setAppliedLabels] = useState<EditLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Load available labels and applied labels
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [allLabels, editLabels] = await Promise.all([
          fetchLabels(),
          fetchEditLabels(editId),
        ]);
        setLabels(allLabels.filter(l => l.is_active));
        setAppliedLabels(editLabels);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [editId]);

  const handleApplyLabel = async (labelId: string) => {
    if (disabled || applying) return;

    try {
      setApplying(labelId);
      setError(null);
      const editLabel = await applyLabel(editId, labelId);
      setAppliedLabels(prev => [...prev, editLabel]);
      setShowPicker(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setApplying(null);
    }
  };

  const handleRemoveLabel = async (editLabelId: string) => {
    if (disabled) return;

    try {
      setError(null);
      await removeLabel(editLabelId);
      setAppliedLabels(prev => prev.filter(l => l.id !== editLabelId));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  // Get labels not yet applied
  const availableLabels = labels.filter(
    l => !appliedLabels.some(al => al.label_id === l.id)
  );

  // Group labels by category
  const groupedLabels = availableLabels.reduce((acc, label) => {
    const category = label.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(label);
    return acc;
  }, {} as Record<string, Label[]>);

  const getSeverityColor = (severity: Label['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/50 border-red-700/50 text-red-300';
      case 'major':
        return 'bg-orange-900/50 border-orange-700/50 text-orange-300';
      case 'minor':
        return 'bg-yellow-900/50 border-yellow-700/50 text-yellow-300';
      case 'info':
      default:
        return 'bg-blue-900/50 border-blue-700/50 text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading labels...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Applied Labels */}
      <div className="flex flex-wrap gap-2">
        {appliedLabels.map((editLabel) => (
          <motion.div
            key={editLabel.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getSeverityColor(editLabel.label.severity)}`}
          >
            <Tag className="w-3 h-3" />
            <span>{editLabel.label.display_name}</span>
            {!disabled && (
              <button
                onClick={() => handleRemoveLabel(editLabel.id)}
                className="hover:bg-white/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}

        {appliedLabels.length === 0 && (
          <span className="text-sm text-zinc-500">No labels applied</span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {/* Add Label Button */}
      {!disabled && availableLabels.length > 0 && (
        <div className="relative">
          <MonochromeButton
            variant="ghost"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowPicker(!showPicker)}
          >
            Add Label
          </MonochromeButton>

          {/* Label Picker Dropdown */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 z-50 w-80 max-h-80 overflow-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl"
              >
                {Object.entries(groupedLabels).map(([category, categoryLabels]) => (
                  <div key={category} className="p-2">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 py-1">
                      {category}
                    </div>
                    {categoryLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => handleApplyLabel(label.id)}
                        disabled={applying === label.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-md text-left transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color || '#888' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-zinc-200 truncate">
                            {label.display_name}
                          </div>
                          {label.description && (
                            <div className="text-xs text-zinc-500 truncate">
                              {label.description}
                            </div>
                          )}
                        </div>
                        {applying === label.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
