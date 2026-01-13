/**
 * Watson E2E Test Data Seeding
 *
 * Creates realistic clinical scenarios for end-to-end testing.
 * Run this before E2E tests to populate the database with test data.
 */

export interface TestDocument {
  title: string;
  source: string;
  document_type: string;
  raw_content: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface TestLLMOutput {
  model_name: string;
  model_version: string;
  output_content: Record<string, unknown>;
  raw_response: string;
  prompt_template: string;
}

export interface TestLabel {
  name: string;
  display_name: string;
  description: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  color: string;
}

// Realistic clinical documents
export const testDocuments: TestDocument[] = [
  {
    title: 'Initial Intake Assessment - Client A',
    source: 'intake_system',
    document_type: 'clinical_assessment',
    raw_content: {
      client_id: 'TEST-001',
      session_date: '2024-01-15',
      presenting_concerns: [
        'Persistent anxiety affecting work performance',
        'Sleep disturbances for past 3 months',
        'Relationship difficulties with spouse',
      ],
      history: {
        previous_therapy: true,
        medications: ['Sertraline 50mg daily'],
        substance_use: 'None reported',
        family_history: 'Mother diagnosed with GAD',
      },
      mental_status_exam: {
        appearance: 'Well-groomed, appropriate dress',
        behavior: 'Cooperative, fidgety at times',
        mood: 'Anxious',
        affect: 'Congruent with mood, mildly restricted range',
        thought_process: 'Linear, goal-directed',
        thought_content: 'No SI/HI, no delusions',
        perception: 'No hallucinations reported',
        cognition: 'Alert, oriented x4',
        insight: 'Good',
        judgment: 'Fair',
      },
      risk_assessment: {
        suicide_risk: 'Low - no current ideation',
        violence_risk: 'Low',
        self_harm: 'None reported',
      },
    },
    metadata: {
      clinician_id: 'DR-123',
      facility: 'Wellness Center',
      session_number: 1,
    },
  },
  {
    title: 'Progress Note - Session 5 - Client B',
    source: 'session_notes',
    document_type: 'progress_note',
    raw_content: {
      client_id: 'TEST-002',
      session_date: '2024-01-20',
      session_type: 'Individual therapy',
      duration_minutes: 50,
      presenting_issues: [
        'Processing grief after loss of parent',
        'Return to work anxiety',
      ],
      interventions: [
        'Grief processing using narrative techniques',
        'Cognitive restructuring for work-related thoughts',
        'Mindfulness breathing exercise',
      ],
      client_response: 'Engaged well, tearful at times, expressed relief at end',
      progress_toward_goals: {
        'Process grief': 'Moderate progress - able to discuss memories',
        'Return to work': 'Early progress - identified specific fears',
      },
      plan: 'Continue grief work, introduce graded exposure for work return',
    },
    metadata: {
      clinician_id: 'DR-456',
      modality: 'CBT/Grief',
    },
  },
  {
    title: 'Crisis Assessment - Client C',
    source: 'crisis_line',
    document_type: 'crisis_assessment',
    raw_content: {
      client_id: 'TEST-003',
      call_date: '2024-01-22',
      call_duration: '45 minutes',
      presenting_crisis: 'Suicidal ideation following job loss',
      risk_factors: [
        'Recent significant loss (employment)',
        'History of depression',
        'Social isolation',
      ],
      protective_factors: [
        'Supportive spouse present',
        'Engaged in outpatient treatment',
        'No access to lethal means',
        'Future orientation (daughters wedding)',
      ],
      safety_plan_created: true,
      disposition: 'Outpatient follow-up within 24 hours',
    },
    metadata: {
      clinician_id: 'DR-789',
      urgency: 'high',
    },
  },
];

// LLM-generated summaries (with intentional issues for testing)
export const testLLMOutputs: { documentIndex: number; output: TestLLMOutput }[] = [
  {
    documentIndex: 0,
    output: {
      model_name: 'clinical-summary-v2',
      model_version: '2.1.0',
      output_content: {
        summary: `Client presents with generalized anxiety disorder symptoms significantly impacting occupational functioning. Sleep disruption noted for approximately 90 days. Currently prescribed Sertraline 25mg with reported compliance.`,
        key_findings: [
          'GAD symptoms with work impact',
          'Sleep disturbance (3 months)',
          'Stable on current medication',
        ],
        risk_level: 'low',
        recommended_interventions: [
          'Continue current medication regimen',
          'CBT for anxiety',
          'Sleep hygiene education',
        ],
        icd_10_codes: ['F41.1', 'G47.00'],
        confidence_score: 0.85,
      },
      raw_response: 'Full model response with tokens...',
      prompt_template: 'clinical_intake_summary_v2',
    },
  },
  {
    documentIndex: 1,
    output: {
      model_name: 'progress-note-analyzer',
      model_version: '1.5.2',
      output_content: {
        summary: `Session 5 focused on grief processing using evidence-based narrative techniques. Client demonstrated good engagement and emotional processing. Work anxiety addressed through cognitive restructuring.`,
        progress_assessment: 'On track',
        treatment_adherence: 'Good',
        next_session_focus: ['Continue grief work', 'Graded exposure planning'],
        billable_time: 50,
        cpt_code: '90834',
      },
      raw_response: 'Full model response...',
      prompt_template: 'progress_note_summary_v1',
    },
  },
  {
    documentIndex: 2,
    output: {
      model_name: 'crisis-assessment-ai',
      model_version: '3.0.1',
      output_content: {
        summary: `Crisis contact following job termination. Client expressed passive suicidal ideation without plan or intent. Multiple protective factors identified including spouse support and future-oriented thinking. Safety plan established.`,
        risk_classification: 'moderate',
        disposition_recommendation: 'Outpatient with 24-48hr follow-up',
        key_interventions: [
          'Safety planning completed',
          'Support system activated',
          'Outpatient appointment confirmed',
        ],
        follow_up_required: true,
      },
      raw_response: 'Full crisis model response...',
      prompt_template: 'crisis_assessment_summary_v3',
    },
  },
];

// Labels for classification
export const testLabels: TestLabel[] = [
  {
    name: 'hallucination',
    display_name: 'Hallucination',
    description: 'Model generated information not present in source document',
    category: 'accuracy',
    severity: 'critical',
    color: '#DC2626',
  },
  {
    name: 'missing_risk',
    display_name: 'Missing Risk Information',
    description: 'Risk factors or safety concerns not adequately captured',
    category: 'safety',
    severity: 'critical',
    color: '#EA580C',
  },
  {
    name: 'incorrect_dosage',
    display_name: 'Incorrect Medication/Dosage',
    description: 'Medication name or dosage incorrectly transcribed',
    category: 'accuracy',
    severity: 'major',
    color: '#D97706',
  },
  {
    name: 'tone_inappropriate',
    display_name: 'Inappropriate Tone',
    description: 'Language or tone not suitable for clinical documentation',
    category: 'style',
    severity: 'minor',
    color: '#2563EB',
  },
  {
    name: 'missing_context',
    display_name: 'Missing Context',
    description: 'Important contextual information omitted',
    category: 'completeness',
    severity: 'major',
    color: '#7C3AED',
  },
  {
    name: 'formatting_issue',
    display_name: 'Formatting Issue',
    description: 'Structural or formatting problems in output',
    category: 'style',
    severity: 'info',
    color: '#64748B',
  },
];

// API helper to seed data
export async function seedTestData(
  apiUrl: string,
  authToken: string
): Promise<{ documents: string[]; outputs: string[]; labels: string[] }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  const documentIds: string[] = [];
  const outputIds: string[] = [];
  const labelIds: string[] = [];

  // Create documents
  for (const doc of testDocuments) {
    const response = await fetch(`${apiUrl}/api/documents/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(doc),
    });

    if (response.ok) {
      const data = await response.json();
      documentIds.push(data.id);
    }
  }

  // Create LLM outputs
  for (const { documentIndex, output } of testLLMOutputs) {
    if (documentIds[documentIndex]) {
      const response = await fetch(`${apiUrl}/api/outputs/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...output,
          document: documentIds[documentIndex],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        outputIds.push(data.id);
      }
    }
  }

  // Create labels
  for (const label of testLabels) {
    const response = await fetch(`${apiUrl}/api/labels/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(label),
    });

    if (response.ok) {
      const data = await response.json();
      labelIds.push(data.id);
    }
  }

  return { documents: documentIds, outputs: outputIds, labels: labelIds };
}

// Cleanup helper
export async function cleanupTestData(
  apiUrl: string,
  authToken: string,
  ids: { documents: string[]; outputs: string[]; labels: string[] }
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${authToken}`,
  };

  // Delete in reverse order of dependencies
  for (const id of ids.outputs) {
    await fetch(`${apiUrl}/api/outputs/${id}/`, { method: 'DELETE', headers });
  }
  for (const id of ids.documents) {
    await fetch(`${apiUrl}/api/documents/${id}/`, { method: 'DELETE', headers });
  }
  for (const id of ids.labels) {
    await fetch(`${apiUrl}/api/labels/${id}/`, { method: 'DELETE', headers });
  }
}
