"""
Management command to seed demo data for Watson MVP.

Creates clinical documents, LLM outputs with intentional errors,
classification labels, and sample edits for demonstration.
"""

from django.core.management.base import BaseCommand
from core.models import Document
from reviews.models import LLMOutput, Label, Edit


class Command(BaseCommand):
    help = 'Seeds demo data for Watson MVP demonstration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Edit.objects.all().delete()
            LLMOutput.objects.all().delete()
            Document.objects.all().delete()
            Label.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared all data'))

        self.stdout.write('Seeding demo data...')

        # Create labels
        labels = self._create_labels()
        self.stdout.write(f'Created {len(labels)} labels')

        # Create documents
        documents = self._create_documents()
        self.stdout.write(f'Created {len(documents)} documents')

        # Create LLM outputs
        outputs = self._create_outputs(documents)
        self.stdout.write(f'Created {len(outputs)} LLM outputs')

        # Create sample edits
        edits = self._create_edits(outputs, labels)
        self.stdout.write(f'Created {len(edits)} sample edits')

        self.stdout.write(self.style.SUCCESS(
            f'\nDemo data seeding complete!\n'
            f'  - Documents: {len(documents)}\n'
            f'  - LLM Outputs: {len(outputs)}\n'
            f'  - Labels: {len(labels)}\n'
            f'  - Edits: {len(edits)}'
        ))

    def _create_labels(self):
        """Create classification labels for issues."""
        label_data = [
            {
                'name': 'hallucination',
                'display_name': 'Hallucination',
                'description': 'LLM generated factually incorrect information not present in source',
                'category': 'accuracy',
                'severity': 'critical',
                'color': '#ef4444',
                'icon': 'alert-triangle',
            },
            {
                'name': 'missing_risk',
                'display_name': 'Missing Risk Factor',
                'description': 'Important risk information was omitted from the summary',
                'category': 'safety',
                'severity': 'critical',
                'color': '#f97316',
                'icon': 'shield-alert',
            },
            {
                'name': 'clinical_inaccuracy',
                'display_name': 'Clinical Inaccuracy',
                'description': 'Medical/clinical information is incorrect',
                'category': 'accuracy',
                'severity': 'major',
                'color': '#eab308',
                'icon': 'file-warning',
            },
            {
                'name': 'wrong_dosage',
                'display_name': 'Wrong Medication Dosage',
                'description': 'Medication dosage is incorrectly stated',
                'category': 'safety',
                'severity': 'critical',
                'color': '#dc2626',
                'icon': 'pill',
            },
            {
                'name': 'severity_underestimate',
                'display_name': 'Severity Underestimate',
                'description': 'Risk or severity level was underestimated',
                'category': 'safety',
                'severity': 'critical',
                'color': '#b91c1c',
                'icon': 'trending-down',
            },
            {
                'name': 'formatting_issue',
                'display_name': 'Formatting Issue',
                'description': 'Output format does not match expected structure',
                'category': 'style',
                'severity': 'minor',
                'color': '#6b7280',
                'icon': 'layout',
            },
            {
                'name': 'missing_context',
                'display_name': 'Missing Context',
                'description': 'Important contextual information was omitted',
                'category': 'completeness',
                'severity': 'major',
                'color': '#8b5cf6',
                'icon': 'file-minus',
            },
            {
                'name': 'good_output',
                'display_name': 'Accurate Output',
                'description': 'Output is clinically accurate and complete',
                'category': 'quality',
                'severity': 'info',
                'color': '#22c55e',
                'icon': 'check-circle',
            },
        ]

        labels = []
        for data in label_data:
            label, created = Label.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                labels.append(label)
            else:
                # Update existing
                for key, value in data.items():
                    setattr(label, key, value)
                label.save()
                labels.append(label)

        return labels

    def _create_documents(self):
        """Create clinical documents."""
        documents_data = [
            {
                'title': 'Intake Assessment - Patient Alpha',
                'source': 'intake_system',
                'document_type': 'clinical_assessment',
                'raw_content': {
                    'presenting_concerns': [
                        'Generalized Anxiety Disorder',
                        'Sleep disturbances',
                        'Work stress'
                    ],
                    'risk_assessment': {
                        'suicide_risk': 'low',
                        'violence_risk': 'low',
                        'self_harm': 'low',
                        'substance_abuse': 'moderate',
                    },
                    'mental_status_exam': {
                        'appearance': 'Well-groomed, appropriate attire',
                        'mood': 'Anxious',
                        'affect': 'Congruent, mildly restricted range',
                        'thought_process': 'Linear, goal-directed',
                        'thought_content': 'No delusions, no hallucinations',
                        'cognition': 'Alert, oriented x4',
                        'insight': 'Good',
                        'judgment': 'Fair',
                    },
                    'medications': [
                        {'name': 'Sertraline', 'dosage': '50mg', 'frequency': 'daily'},
                        {'name': 'Trazodone', 'dosage': '50mg', 'frequency': 'PRN for sleep'},
                    ],
                    'diagnosis': ['F41.1 - Generalized Anxiety Disorder'],
                },
            },
            {
                'title': 'Progress Note - Patient Beta',
                'source': 'progress_notes',
                'document_type': 'progress_note',
                'raw_content': {
                    'session_number': 5,
                    'session_type': 'Individual Therapy',
                    'presenting_concerns': ['Depression', 'Relationship difficulties'],
                    'interventions': ['CBT techniques', 'Behavioral activation'],
                    'progress': 'Patient showing gradual improvement in mood',
                    'risk_assessment': {
                        'suicide_risk': 'low',
                        'violence_risk': 'none',
                    },
                    'plan': 'Continue weekly sessions, maintain medication',
                },
            },
            {
                'title': 'Crisis Assessment - Patient Gamma',
                'source': 'crisis_team',
                'document_type': 'crisis_assessment',
                'raw_content': {
                    'presenting_concerns': [
                        'Acute suicidal ideation',
                        'Recent job loss',
                        'Social isolation'
                    ],
                    'risk_assessment': {
                        'suicide_risk': 'high',
                        'violence_risk': 'low',
                        'immediate_safety': 'requires monitoring',
                    },
                    'safety_plan': {
                        'warning_signs': ['Withdrawal', 'Increased alcohol use'],
                        'coping_strategies': ['Call crisis line', 'Contact friend'],
                        'emergency_contacts': ['Sister: 555-0123', 'Therapist: 555-0456'],
                    },
                    'disposition': 'Voluntary inpatient admission recommended',
                },
            },
        ]

        documents = []
        for data in documents_data:
            doc = Document.objects.create(**data)
            documents.append(doc)

        return documents

    def _create_outputs(self, documents):
        """Create LLM outputs with intentional errors for testing."""
        outputs_data = [
            {
                'document': documents[0],
                'model_name': 'clinical-summary-v2',
                'model_version': '2.1.0',
                'output_content': {
                    # ERROR: Wrong dosage (50mg -> 100mg)
                    'summary': 'Patient presents with generalized anxiety disorder. Currently prescribed Sertraline 100mg daily.',
                    'risk_level': 'low',
                    'recommendations': [
                        'Continue current medication regimen',
                        'Weekly therapy sessions',
                        'Sleep hygiene education',
                    ],
                    'key_findings': ['Anxiety symptoms', 'Sleep disturbances', 'Good insight'],
                },
                'raw_response': 'Based on the intake assessment, the patient is experiencing symptoms consistent with GAD...',
                'prompt_template': 'clinical_summary_v2',
                'generation_params': {'temperature': 0.3, 'max_tokens': 500},
            },
            {
                'document': documents[1],
                'model_name': 'progress-note-analyzer',
                'model_version': '1.5.0',
                'output_content': {
                    'summary': 'Patient showing improvement in depressive symptoms after 5 sessions of CBT.',
                    'progress_rating': 'moderate_improvement',
                    'treatment_adherence': 'good',
                    # MISSING: Risk assessment summary
                    'next_steps': ['Continue CBT', 'Consider group therapy'],
                },
                'raw_response': 'Analysis of session 5 indicates positive treatment response...',
                'prompt_template': 'progress_analysis_v1',
                'generation_params': {'temperature': 0.2, 'max_tokens': 400},
            },
            {
                'document': documents[2],
                'model_name': 'crisis-triage-assistant',
                'model_version': '3.0.0',
                'output_content': {
                    # ERROR: Should be 'high' based on assessment
                    'risk_classification': 'moderate',
                    'summary': 'Patient experiencing suicidal thoughts following job loss.',
                    # ERROR: Contradicts inpatient recommendation
                    'recommended_disposition': 'outpatient follow-up',
                    'safety_concerns': ['Active ideation', 'Limited support system'],
                    # ERROR: Should be urgent
                    'urgency_level': 'routine',
                },
                'raw_response': 'Crisis assessment analysis indicates patient requires...',
                'prompt_template': 'crisis_triage_v3',
                'generation_params': {'temperature': 0.1, 'max_tokens': 600},
            },
        ]

        outputs = []
        for data in outputs_data:
            output = LLMOutput.objects.create(**data)
            outputs.append(output)

        return outputs

    def _create_edits(self, outputs, labels):
        """Create sample edits with corrections."""
        edits = []

        # Create a draft edit with corrected content for first output
        edit = Edit.objects.create(
            llm_output=outputs[0],
            editor_id='demo-clinician-001',
            editor_name='Dr. Demo Clinician',
            edited_content={
                # Corrected dosage
                'summary': 'Patient presents with generalized anxiety disorder. Currently prescribed Sertraline 50mg daily.',
                'risk_level': 'low',
                'recommendations': [
                    'Continue current medication regimen',
                    'Weekly therapy sessions',
                    'Sleep hygiene education',
                ],
                'key_findings': ['Anxiety symptoms', 'Sleep disturbances', 'Good insight'],
            },
            status='draft',
            editor_notes='Corrected medication dosage from 100mg to 50mg (hallucination error)',
        )

        # Apply wrong_dosage label
        wrong_dosage_label = next((l for l in labels if l.name == 'wrong_dosage'), None)
        if wrong_dosage_label:
            edit.labels.add(wrong_dosage_label)

        edits.append(edit)

        # Create an in_review edit for second output
        edit2 = Edit.objects.create(
            llm_output=outputs[1],
            editor_id='demo-clinician-002',
            editor_name='Dr. Second Reviewer',
            edited_content={
                'summary': 'Patient showing improvement in depressive symptoms after 5 sessions of CBT.',
                'progress_rating': 'moderate_improvement',
                'treatment_adherence': 'good',
                # Added missing risk assessment
                'risk_assessment': 'Low suicide risk, no violence risk as documented in session.',
                'next_steps': ['Continue CBT', 'Consider group therapy'],
            },
            status='in_review',
            editor_notes='Added missing risk assessment summary that was omitted from original output',
        )

        # Apply missing_risk label
        missing_risk_label = next((l for l in labels if l.name == 'missing_risk'), None)
        if missing_risk_label:
            edit2.labels.add(missing_risk_label)

        edits.append(edit2)

        # Create a submitted edit for third output (critical error correction)
        edit3 = Edit.objects.create(
            llm_output=outputs[2],
            editor_id='demo-clinician-001',
            editor_name='Dr. Demo Clinician',
            edited_content={
                # Corrected risk classification
                'risk_classification': 'high',
                'summary': 'Patient experiencing acute suicidal ideation with recent job loss and social isolation.',
                # Corrected disposition
                'recommended_disposition': 'voluntary inpatient admission',
                'safety_concerns': ['Active ideation', 'Limited support system', 'Recent major stressor'],
                # Corrected urgency
                'urgency_level': 'urgent',
            },
            status='draft',
            editor_notes='CRITICAL: Corrected severe underestimate of risk level and disposition. Original output dangerously underestimated patient risk.',
        )

        # Apply severity_underestimate label
        severity_label = next((l for l in labels if l.name == 'severity_underestimate'), None)
        if severity_label:
            edit3.labels.add(severity_label)

        edits.append(edit3)

        return edits
