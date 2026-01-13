/**
 * Production Test Data Seeding
 *
 * Creates realistic test data for integration tests.
 * Seeds documents, LLM outputs, and edits with intentional issues
 * for clinician review workflow testing.
 */

import { APIClient } from '../helpers/api-client';

export interface SeededData {
  documentIds: string[];
  outputIds: string[];
  editIds: string[];
  labelIds: string[];
}

/**
 * Clinical documents representing intake assessments
 */
const CLINICAL_DOCUMENTS = [
  {
    title: 'Intake Assessment - Patient Alpha',
    source: 'intake_system',
    document_type: 'clinical_assessment',
    raw_content: {
      presenting_concerns: ['Generalized Anxiety Disorder', 'Sleep disturbances', 'Work stress'],
      risk_assessment: {
        suicide_risk: 'low',
        violence_risk: 'low',
        self_harm: 'low',
        substance_abuse: 'moderate',
      },
      mental_status_exam: {
        appearance: 'Well-groomed, appropriate attire',
        mood: 'Anxious',
        affect: 'Congruent, mildly restricted range',
        thought_process: 'Linear, goal-directed',
        thought_content: 'No delusions, no hallucinations',
        cognition: 'Alert, oriented x4',
        insight: 'Good',
        judgment: 'Fair',
      },
      medications: [
        { name: 'Sertraline', dosage: '50mg', frequency: 'daily' },
        { name: 'Trazodone', dosage: '50mg', frequency: 'PRN for sleep' },
      ],
      diagnosis: ['F41.1 - Generalized Anxiety Disorder'],
    },
  },
  {
    title: 'Progress Note - Patient Beta',
    source: 'progress_notes',
    document_type: 'progress_note',
    raw_content: {
      session_number: 5,
      session_type: 'Individual Therapy',
      presenting_concerns: ['Depression', 'Relationship difficulties'],
      interventions: ['CBT techniques', 'Behavioral activation'],
      progress: 'Patient showing gradual improvement in mood',
      risk_assessment: {
        suicide_risk: 'low',
        violence_risk: 'none',
      },
      plan: 'Continue weekly sessions, maintain medication',
    },
  },
  {
    title: 'Crisis Assessment - Patient Gamma',
    source: 'crisis_team',
    document_type: 'crisis_assessment',
    raw_content: {
      presenting_concerns: ['Acute suicidal ideation', 'Recent job loss', 'Social isolation'],
      risk_assessment: {
        suicide_risk: 'high',
        violence_risk: 'low',
        immediate_safety: 'requires monitoring',
      },
      safety_plan: {
        warning_signs: ['Withdrawal', 'Increased alcohol use'],
        coping_strategies: ['Call crisis line', 'Contact friend'],
        emergency_contacts: ['Sister: 555-0123', 'Therapist: 555-0456'],
      },
      disposition: 'Voluntary inpatient admission recommended',
    },
  },
];

/**
 * LLM outputs with intentional issues for testing
 */
function createLLMOutputs(documentIds: string[]) {
  return [
    {
      document_id: documentIds[0],
      model_name: 'clinical-summary-v2',
      model_version: '2.1.0',
      output_content: {
        summary:
          'Patient presents with generalized anxiety disorder. Currently prescribed Sertraline 100mg daily.', // ERROR: Wrong dosage (50mg -> 100mg)
        risk_level: 'low',
        recommendations: [
          'Continue current medication regimen',
          'Weekly therapy sessions',
          'Sleep hygiene education',
        ],
        key_findings: ['Anxiety symptoms', 'Sleep disturbances', 'Good insight'],
      },
      raw_response:
        'Based on the intake assessment, the patient is experiencing symptoms consistent with GAD...',
      prompt_template: 'clinical_summary_v2',
      generation_params: { temperature: 0.3, max_tokens: 500 },
    },
    {
      document_id: documentIds[1],
      model_name: 'progress-note-analyzer',
      model_version: '1.5.0',
      output_content: {
        summary: 'Patient showing improvement in depressive symptoms after 5 sessions of CBT.',
        progress_rating: 'moderate_improvement',
        treatment_adherence: 'good',
        // MISSING: Risk assessment summary
        next_steps: ['Continue CBT', 'Consider group therapy'],
      },
      raw_response: 'Analysis of session 5 indicates positive treatment response...',
      prompt_template: 'progress_analysis_v1',
      generation_params: { temperature: 0.2, max_tokens: 400 },
    },
    {
      document_id: documentIds[2],
      model_name: 'crisis-triage-assistant',
      model_version: '3.0.0',
      output_content: {
        risk_classification: 'moderate', // ERROR: Should be 'high' based on assessment
        summary: 'Patient experiencing suicidal thoughts following job loss.',
        recommended_disposition: 'outpatient follow-up', // ERROR: Contradicts inpatient recommendation
        safety_concerns: ['Active ideation', 'Limited support system'],
        urgency_level: 'routine', // ERROR: Should be urgent
      },
      raw_response: 'Crisis assessment analysis indicates patient requires...',
      prompt_template: 'crisis_triage_v3',
      generation_params: { temperature: 0.1, max_tokens: 600 },
    },
  ];
}

/**
 * Issue labels for classification
 */
const ISSUE_LABELS = [
  {
    name: 'hallucination',
    display_name: 'Hallucination',
    description: 'LLM generated factually incorrect information not present in source',
    category: 'accuracy',
    severity: 'critical',
    color: '#ef4444',
  },
  {
    name: 'missing_risk',
    display_name: 'Missing Risk Factor',
    description: 'Important risk information was omitted from the summary',
    category: 'safety',
    severity: 'critical',
    color: '#f97316',
  },
  {
    name: 'clinical_inaccuracy',
    display_name: 'Clinical Inaccuracy',
    description: 'Medical/clinical information is incorrect',
    category: 'accuracy',
    severity: 'major',
    color: '#eab308',
  },
  {
    name: 'wrong_dosage',
    display_name: 'Wrong Medication Dosage',
    description: 'Medication dosage is incorrectly stated',
    category: 'safety',
    severity: 'critical',
    color: '#dc2626',
  },
  {
    name: 'severity_underestimate',
    display_name: 'Severity Underestimate',
    description: 'Risk or severity level was underestimated',
    category: 'safety',
    severity: 'critical',
    color: '#b91c1c',
  },
  {
    name: 'formatting_issue',
    display_name: 'Formatting Issue',
    description: 'Output format does not match expected structure',
    category: 'style',
    severity: 'minor',
    color: '#6b7280',
  },
  {
    name: 'missing_context',
    display_name: 'Missing Context',
    description: 'Important contextual information was omitted',
    category: 'completeness',
    severity: 'major',
    color: '#8b5cf6',
  },
  {
    name: 'good_output',
    display_name: 'Accurate Output',
    description: 'Output is clinically accurate and complete',
    category: 'quality',
    severity: 'info',
    color: '#22c55e',
  },
];

/**
 * Seed all production test data
 */
export async function seedProductionData(client: APIClient): Promise<SeededData> {
  console.log('[Seed] Starting production data seeding...');

  const result: SeededData = {
    documentIds: [],
    outputIds: [],
    editIds: [],
    labelIds: [],
  };

  // 1. Create Documents
  console.log('[Seed] Creating clinical documents...');
  for (const doc of CLINICAL_DOCUMENTS) {
    try {
      const response = await client.createDocument(doc);
      if (response.ok()) {
        const data = await response.json();
        result.documentIds.push(data.id);
        console.log(`[Seed] Created document: ${data.id}`);
      } else {
        console.warn(`[Seed] Failed to create document: ${response.status()}`);
      }
    } catch (error) {
      console.error('[Seed] Error creating document:', error);
    }
  }

  // 2. Create LLM Outputs (linked to documents)
  if (result.documentIds.length > 0) {
    console.log('[Seed] Creating LLM outputs...');
    const outputs = createLLMOutputs(result.documentIds);
    for (const output of outputs) {
      try {
        const response = await client.createOutput(output);
        if (response.ok()) {
          const data = await response.json();
          result.outputIds.push(data.id);
          console.log(`[Seed] Created output: ${data.id}`);
        } else {
          console.warn(`[Seed] Failed to create output: ${response.status()}`);
        }
      } catch (error) {
        console.error('[Seed] Error creating output:', error);
      }
    }
  }

  // 3. Create Labels
  console.log('[Seed] Creating issue labels...');
  for (const label of ISSUE_LABELS) {
    try {
      const response = await client.createLabel(label);
      if (response.ok()) {
        const data = await response.json();
        result.labelIds.push(data.id);
        console.log(`[Seed] Created label: ${data.id}`);
      } else if (response.status() === 400) {
        // Label might already exist, try to fetch existing
        const existingResponse = await client.getLabels();
        if (existingResponse.ok()) {
          const labels = await existingResponse.json();
          const existing = labels.find((l: { name: string }) => l.name === label.name);
          if (existing) {
            result.labelIds.push(existing.id);
          }
        }
      } else {
        console.warn(`[Seed] Failed to create label: ${response.status()}`);
      }
    } catch (error) {
      console.error('[Seed] Error creating label:', error);
    }
  }

  // 4. Create sample edits (draft status)
  if (result.outputIds.length > 0) {
    console.log('[Seed] Creating sample edits...');
    try {
      // Create a draft edit for the first output
      const editData = {
        llm_output_id: result.outputIds[0],
        edited_content: {
          summary:
            'Patient presents with generalized anxiety disorder. Currently prescribed Sertraline 50mg daily.', // Corrected dosage
          risk_level: 'low',
          recommendations: [
            'Continue current medication regimen',
            'Weekly therapy sessions',
            'Sleep hygiene education',
          ],
          key_findings: ['Anxiety symptoms', 'Sleep disturbances', 'Good insight'],
        },
        editor_name: 'Dr. Test Clinician',
        editor_notes: 'Corrected medication dosage from 100mg to 50mg',
        status: 'draft',
      };

      const response = await client.createEdit(editData);
      if (response.ok()) {
        const data = await response.json();
        result.editIds.push(data.id);
        console.log(`[Seed] Created edit: ${data.id}`);
      }
    } catch (error) {
      console.error('[Seed] Error creating edit:', error);
    }
  }

  console.log('[Seed] Seeding complete:', {
    documents: result.documentIds.length,
    outputs: result.outputIds.length,
    labels: result.labelIds.length,
    edits: result.editIds.length,
  });

  return result;
}

/**
 * Clean up seeded data after tests
 */
export async function cleanupSeededData(client: APIClient, data: SeededData): Promise<void> {
  console.log('[Cleanup] Cleaning up test data...');

  // Note: In a real implementation, you'd delete in reverse order
  // For now, we'll rely on test database isolation

  console.log('[Cleanup] Cleanup complete');
}
