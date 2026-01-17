import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, Loader2, AlertCircle, CheckCircle, FileText, Tags } from 'lucide-react';
import { MonochromeButton } from '@/components/MonochromeButton';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { LabelPicker } from '@/components/labels/LabelPicker';
import { fetchEdit, updateEdit, submitEdit, type Edit, handleApiError } from '@/utils/api';

export function EditView() {
  const { editId } = useParams<{ editId: string }>();
  const navigate = useNavigate();

  const [edit, setEdit] = useState<Edit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');

  // Load edit data
  useEffect(() => {
    async function loadEdit() {
      if (!editId) return;

      try {
        setLoading(true);
        setError(null);
        const editData = await fetchEdit(editId);
        setEdit(editData);

        // Initialize editor with edited_content or original output content
        const content = editData.edited_content?.summary ||
          editData.edited_content?.content ||
          JSON.stringify(editData.edited_content, null, 2);
        setEditorContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadEdit();
  }, [editId]);

  // Handle save draft
  const handleSave = async () => {
    if (!edit || !editId) return;

    try {
      setSaving(true);
      setError(null);

      const updatedEdit = await updateEdit(editId, {
        edited_content: {
          ...edit.edited_content,
          summary: editorContent,
        },
      });

      setEdit(updatedEdit);
      setSuccessMessage('Draft saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!edit || !editId) return;

    try {
      setSubmitting(true);
      setError(null);

      // First save the content
      await updateEdit(editId, {
        edited_content: {
          ...edit.edited_content,
          summary: editorContent,
        },
      });

      // Then submit
      const submittedEdit = await submitEdit(editId);
      setEdit(submittedEdit);
      setSuccessMessage('Edit submitted successfully! Diff computed.');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <span className="ml-3 text-zinc-400">Loading edit...</span>
      </div>
    );
  }

  // Error state
  if (error && !edit) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-card p-6 border-red-500/50">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading edit: {error}</span>
          </div>
          <MonochromeButton
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => navigate('/app/reviews')}
          >
            Back to Reviews
          </MonochromeButton>
        </div>
      </div>
    );
  }

  if (!edit) return null;

  const isSubmitted = edit.status === 'submitted' || edit.status === 'approved' || edit.status === 'rejected';

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <MonochromeButton
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/app/reviews')}
        >
          Back to Reviews
        </MonochromeButton>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 mb-1">
            Edit Review - {edit.id.slice(0, 8)}
          </h1>
          <p className="text-zinc-400">
            {edit.llm_output?.model_name} • {edit.llm_output?.document_title || 'Document'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            edit.status === 'draft' ? 'bg-zinc-800 text-zinc-300' :
            edit.status === 'submitted' ? 'bg-blue-900/50 text-blue-300' :
            edit.status === 'approved' ? 'bg-green-900/50 text-green-300' :
            'bg-zinc-800 text-zinc-300'
          }`}>
            {edit.status.charAt(0).toUpperCase() + edit.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{successMessage}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </motion.div>
      )}

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original LLM Output */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-50">Original LLM Output</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 min-h-[400px] overflow-auto">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
              {edit.llm_output?.model_name && (
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <span className="text-zinc-500">Model:</span> {edit.llm_output.model_name}
                  <br />
                  <span className="text-zinc-500">Version:</span> {edit.llm_output.model_version}
                </div>
              )}
              {JSON.stringify(edit.edited_content, null, 2)}
            </pre>
          </div>
        </div>

        {/* Editor */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-50">Clinician Edit</h2>
            {!isSubmitted && (
              <div className="flex gap-2">
                <MonochromeButton
                  variant="ghost"
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </MonochromeButton>
                <MonochromeButton
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </MonochromeButton>
              </div>
            )}
          </div>

          <div className="[&_.tiptap]:min-h-[400px] [&_.tiptap]:bg-zinc-900 [&_.tiptap]:border [&_.tiptap]:border-zinc-800 [&_.tiptap]:rounded-lg">
            <SimpleEditor
              initialContent={editorContent}
              onChange={setEditorContent}
            />
          </div>
        </div>
      </div>

      {/* Diff Stats (shown after submission) */}
      {isSubmitted && edit.diff_stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Diff Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-zinc-50">
                {edit.diff_stats.change_rate?.toFixed(1)}%
              </div>
              <div className="text-sm text-zinc-400">Change Rate</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                +{edit.diff_stats.token_additions || 0}
              </div>
              <div className="text-sm text-zinc-400">Tokens Added</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">
                -{edit.diff_stats.token_deletions || 0}
              </div>
              <div className="text-sm text-zinc-400">Tokens Removed</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {edit.diff_stats.total_structural_changes || 0}
              </div>
              <div className="text-sm text-zinc-400">Structural Changes</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Labels Section */}
      <div className="mt-6 glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tags className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-50">Classification Labels</h2>
        </div>
        <LabelPicker editId={editId!} disabled={isSubmitted} />
      </div>

      {/* Editor Notes */}
      {!isSubmitted && (
        <div className="mt-6 glass-card p-6">
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Editor Notes</h2>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-700"
            rows={3}
            placeholder="Add notes about your changes..."
            defaultValue={edit.editor_notes || ''}
          />
        </div>
      )}
    </div>
  );
}
