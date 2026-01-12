# Watson Autonomous Development Roadmap

**Created**: 2026-01-12
**Status**: Planning
**Methodology**: Ralph Wiggum Iterative AI Loops

---

## Executive Summary

This document outlines an autonomous development roadmap for Watson, a clinical LLM output review and curation tool. The roadmap leverages the Ralph Wiggum technique for iterative AI-driven development across multiple phases, enabling systematic progress from the current state (~60% complete) to production readiness.

---

## Current Project Status

### Implementation Assessment

| Layer | Completion | Status |
|-------|------------|--------|
| **Frontend UI/UX** | ~95% | Polished monochrome design, 52+ TipTap components, research panels |
| **Infrastructure** | ~80% | Docker, CI/CD, deployment configs ready |
| **Documentation** | ~70% | PRDs, specs, implementation reports |
| **Testing** | ~40% | CI pipeline exists, minimal actual tests |
| **Backend API** | ~5% | Only health endpoints, no models/serializers |
| **Data Layer** | 0% | No models defined, all data is mocked |

### Critical Gaps

1. **No Data Persistence** - Database models not defined, no API endpoints, all frontend data is mocked
2. **No Authentication Implementation** - JWT verification middleware missing, Passport integration incomplete
3. **No Backend API** - Zero REST endpoints (except health checks), no serializers or views
4. **No Diff/Analytics Engine** - Edit tracking and change analysis not implemented
5. **Limited Testing** - Test files are mostly empty, no meaningful coverage

### Strengths

1. **Professional UI/UX** - Polished monochrome design system with glass morphism
2. **Rich Text Editor** - Full TipTap implementation with 52+ components
3. **Infrastructure Ready** - Docker, CI/CD, multi-platform deployment configs
4. **Clear Documentation** - PRDs, specs, and implementation reports

---

## Ralph Wiggum Technique Overview

The Ralph Wiggum technique is an iterative development methodology based on continuous AI loops:

```bash
while :; do
  cat PROMPT.md | claude-code --continue
done
```

### Core Principles

- **Same prompt repeated** - Claude receives identical instructions each iteration
- **Self-referential progress** - Claude sees its own previous work in files and git history
- **Deterministic failures** - Failures are predictable, enabling systematic improvement
- **Completion promises** - `<promise>TAG</promise>` signals task completion

### When to Use

**Good for:**
- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement
- Greenfield development
- Systematic implementation of specifications

**Not good for:**
- Tasks requiring human judgment or design decisions
- One-shot operations
- Tasks with unclear success criteria

---

## Development Phases

### Phase 1: Data Foundation

**Objective**: Define Django models for Document, LLMOutput, Edit, Label, EditLabel

**Ralph Command**:
```bash
/ralph-loop "Implement Django models in backend/core/models.py and backend/reviews/models.py following the CLAUDE.md data model spec. Create and run migrations. Output <promise>MODELS COMPLETE</promise> when migrations succeed and models match spec." --completion-promise "MODELS COMPLETE" --max-iterations 8
```

**Success Criteria**:
- All 5 core models defined with relationships
- Migrations generated and applied
- Admin registrations complete

**Models to Implement**:
```python
# backend/core/models.py
class Document:
    """Source clinical note (raw JSON)"""
    pass

# backend/reviews/models.py
class LLMOutput:
    """Model-generated summary tied to a Document"""
    pass

class Edit:
    """Clinician revision with diffs, edited JSON, status"""
    pass

class Label:
    """Taxonomy of issue types (hallucination, missing_risk, etc.)"""
    pass

class EditLabel:
    """Join table for applied labels"""
    pass
```

**Estimated Iterations**: 8

---

### Phase 2: API Layer

**Objective**: REST endpoints for CRUD operations on all models

#### Phase 2a: Outputs API

```bash
/ralph-loop "Implement DRF serializers and viewsets for Document and LLMOutput models. Add to urls.py. Test with curl. Output <promise>OUTPUTS API DONE</promise> when GET/POST/PUT work." --completion-promise "OUTPUTS API DONE" --max-iterations 10
```

**Endpoints**:
- `GET /api/documents/` - List documents
- `GET /api/documents/:id/` - Get document
- `POST /api/documents/` - Create document
- `GET /api/outputs/` - List LLM outputs
- `GET /api/outputs/:id/` - Get output with document

#### Phase 2b: Edits API

```bash
/ralph-loop "Implement Edit API with draft creation, save, and submit endpoints. Include status transitions (draft → submitted). Output <promise>EDITS API DONE</promise> when full workflow works." --completion-promise "EDITS API DONE" --max-iterations 10
```

**Endpoints**:
- `POST /api/edits/` - Create draft edit
- `PUT /api/edits/:id/` - Save draft changes
- `POST /api/edits/:id/submit/` - Finalize and compute diffs
- `GET /api/edits/:id/diff/` - Return/render diff

#### Phase 2c: Labels API

```bash
/ralph-loop "Implement Label and EditLabel APIs. Support label taxonomy and applying labels to edits. Output <promise>LABELS API DONE</promise>." --completion-promise "LABELS API DONE" --max-iterations 8
```

**Endpoints**:
- `GET /api/labels/` - List available labels
- `POST /api/edits/:id/labels/` - Apply label to edit
- `DELETE /api/edits/:id/labels/:label_id/` - Remove label

**Total Phase 2 Iterations**: 28

---

### Phase 3: Diff Engine

**Objective**: Token-level and structural diff calculation on edit submission

**Ralph Command**:
```bash
/ralph-loop "Build diff calculation engine in backend/reviews/services/. Compute token-level diffs using difflib. Store diffs as JSON. Integrate with Edit.submit() method. Write tests. Output <promise>DIFF ENGINE COMPLETE</promise> when tests pass." --completion-promise "DIFF ENGINE COMPLETE" --max-iterations 15
```

**Implementation Details**:
```python
# backend/reviews/services/diff_engine.py
class DiffEngine:
    def compute_token_diff(self, original: str, edited: str) -> dict:
        """Token-level diff using difflib"""
        pass

    def compute_structural_diff(self, original: dict, edited: dict) -> dict:
        """JSON structural diff"""
        pass

    def generate_diff_report(self, edit: Edit) -> dict:
        """Full diff report for an edit"""
        pass
```

**Estimated Iterations**: 15

---

### Phase 4: Authentication Integration

**Objective**: Connect to passport.oceanheart.ai JWT auth

**Ralph Command**:
```bash
/ralph-loop "Implement JWT RS256 verification middleware for passport.oceanheart.ai. Add to Django middleware stack. Protect API endpoints. Update frontend AuthContext to use real tokens. Output <promise>AUTH INTEGRATED</promise> when protected endpoints reject invalid tokens and accept valid ones." --completion-promise "AUTH INTEGRATED" --max-iterations 12
```

**Implementation Components**:
1. JWT middleware in `backend/watson/middleware/jwt_auth.py`
2. Public key fetching from passport.oceanheart.ai
3. Token validation and user extraction
4. Frontend AuthContext updates
5. Protected route enforcement

**Estimated Iterations**: 12

---

### Phase 5: Frontend-Backend Integration

**Objective**: Replace mock data with real API calls

#### Phase 5a: Reviews Panel

```bash
/ralph-loop "Connect ReviewsPanel.tsx to real /api/edits/ endpoint. Replace mock reviews with API data. Handle loading/error states. Output <promise>REVIEWS CONNECTED</promise>." --completion-promise "REVIEWS CONNECTED" --max-iterations 8
```

#### Phase 5b: Analytics Panel

```bash
/ralph-loop "Connect AnalyticsPanel.tsx to /api/analytics/ endpoint. Display real edit patterns and model performance data. Output <promise>ANALYTICS CONNECTED</promise>." --completion-promise "ANALYTICS CONNECTED" --max-iterations 8
```

**Note**: These loops can run concurrently in separate terminal sessions.

**Total Phase 5 Iterations**: 16

---

### Phase 6: Testing & Validation

**Objective**: Comprehensive test coverage for new code

**Ralph Command**:
```bash
/ralph-loop "Write pytest tests for all Django models, serializers, and views. Write Bun tests for React components with API interactions. Achieve 80%+ coverage. Output <promise>TESTS PASSING</promise> when bun run test:all passes with coverage threshold." --completion-promise "TESTS PASSING" --max-iterations 20
```

**Test Categories**:
1. Model unit tests (Django)
2. Serializer validation tests
3. ViewSet integration tests
4. Diff engine tests
5. React component tests (Bun)
6. API integration tests

**Estimated Iterations**: 20

---

### Phase 7: Export Pipeline

**Objective**: Research dataset export (JSONL/CSV bundles)

**Ralph Command**:
```bash
/ralph-loop "Implement /api/exports/ endpoint. Generate JSONL and CSV bundles of edits with diffs and labels. Add download UI to AnalyticsPanel. Output <promise>EXPORT WORKING</promise> when a valid export ZIP downloads." --completion-promise "EXPORT WORKING" --max-iterations 10
```

**Export Formats**:
- JSONL: Full edit records with nested diffs and labels
- CSV: Flattened tabular format for analysis
- ZIP bundle: Combined export with metadata

**Estimated Iterations**: 10

---

## Multi-Level Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR LEVEL                       │
│  (Human-triggered, high-level phase management)             │
│  /ralph-loop "Complete Phase N..." --max-iterations 30      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LEVEL                             │
│  (Per-feature loops running sequentially or parallel)       │
│  /ralph-loop "Build Edits API..." --max-iterations 10       │
│  /ralph-loop "Build Labels API..." --max-iterations 8       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TASK LEVEL                               │
│  (Micro-loops for specific fixes/refinements)               │
│  /ralph-loop "Fix serializer validation..." --max 5         │
└─────────────────────────────────────────────────────────────┘
```

### Orchestration Strategies

#### Sequential Execution
For dependent phases, execute one after another:
```bash
# Phase 1 must complete before Phase 2
/ralph-loop "Phase 1: Models..." --completion-promise "MODELS COMPLETE"
# Wait for completion
/ralph-loop "Phase 2: APIs..." --completion-promise "APIS COMPLETE"
```

#### Parallel Execution
For independent features, run in separate terminals:
```bash
# Terminal 1
/ralph-loop "Build Reviews API..." --completion-promise "REVIEWS DONE"

# Terminal 2 (simultaneously)
/ralph-loop "Build Labels API..." --completion-promise "LABELS DONE"
```

#### Nested Loops
For complex phases, use outer loop with inner refinement:
```bash
# Outer loop manages overall phase
/ralph-loop "Complete Phase 2 API Layer. Sub-tasks: Outputs API, Edits API, Labels API. Output <promise>PHASE 2 COMPLETE</promise> when all endpoints work." --max-iterations 30
```

---

## Execution Schedule

| Priority | Phase | Estimated Iterations | Dependencies | Parallelizable |
|----------|-------|---------------------|--------------|----------------|
| 1 | Data Foundation | 8 | None | No |
| 2 | Outputs API | 10 | Phase 1 | No |
| 3 | Edits API | 10 | Phase 1, 2 | No |
| 4 | Labels API | 8 | Phase 1 | Yes (with 3) |
| 5 | Diff Engine | 15 | Phase 3 | No |
| 6 | Authentication | 12 | Phase 2-4 | No |
| 7 | Frontend Integration | 16 | Phase 6 | Yes (5a/5b) |
| 8 | Testing | 20 | All prior | No |
| 9 | Export Pipeline | 10 | Phase 8 | No |

**Total Estimated Iterations**: ~109

---

## Success Metrics

### Phase Completion Criteria

| Phase | Completion Promise | Verification |
|-------|-------------------|--------------|
| 1 | `MODELS COMPLETE` | `python manage.py migrate` succeeds |
| 2a | `OUTPUTS API DONE` | `curl /api/outputs/` returns 200 |
| 2b | `EDITS API DONE` | Full edit workflow via curl |
| 2c | `LABELS API DONE` | Label CRUD operations work |
| 3 | `DIFF ENGINE COMPLETE` | Diff tests pass |
| 4 | `AUTH INTEGRATED` | Protected endpoints enforce auth |
| 5a | `REVIEWS CONNECTED` | Real data in ReviewsPanel |
| 5b | `ANALYTICS CONNECTED` | Real data in AnalyticsPanel |
| 6 | `TESTS PASSING` | `bun run test:all` passes |
| 7 | `EXPORT WORKING` | ZIP download succeeds |

### Overall Project Completion

- [ ] All Django models implemented and migrated
- [ ] Full REST API with 15+ endpoints
- [ ] JWT authentication enforced
- [ ] Diff engine computing token-level changes
- [ ] Frontend connected to real API
- [ ] 80%+ test coverage
- [ ] Export pipeline functional
- [ ] Production deployment successful

---

## Risk Mitigation

### Common Failure Modes

1. **Infinite loops** - Always use `--max-iterations` flag
2. **Scope creep** - Keep prompts focused on specific deliverables
3. **Integration conflicts** - Run tests after each phase
4. **Auth complexity** - Start with mock auth, migrate to real JWT

### Recovery Strategies

```bash
# Cancel stuck loop
/cancel-ralph

# Check current state
git status
git diff

# Rollback if needed
git checkout -- .

# Restart with adjusted prompt
/ralph-loop "Revised prompt..." --max-iterations N
```

---

## Quick Start Commands

### Begin Phase 1 (Recommended Starting Point)

```bash
/ralph-loop "Implement Django models in backend/core/models.py and backend/reviews/models.py. Create Document, LLMOutput, Edit, Label, and EditLabel models per CLAUDE.md spec. Generate and apply migrations. Register in admin. Output <promise>MODELS COMPLETE</promise> when all migrations succeed." --completion-promise "MODELS COMPLETE" --max-iterations 8
```

### Full Project Loop (Advanced)

```bash
/ralph-loop "Complete Watson backend implementation following docs/specs/autonomous-development-roadmap.md. Progress through phases sequentially. Output <promise>WATSON COMPLETE</promise> when all tests pass and frontend connects to real API." --completion-promise "WATSON COMPLETE" --max-iterations 100
```

---

## References

- [Ralph Wiggum Technique](https://ghuntley.com/ralph/) - Original methodology
- [Ralph Orchestrator](https://github.com/mikeyobrien/ralph-orchestrator) - Orchestration tooling
- [CLAUDE.md](../CLAUDE.md) - Project instructions and data model spec
- [blueprint.md](./blueprint.md) - Architecture blueprint

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-12 | 1.0.0 | Initial roadmap creation |
