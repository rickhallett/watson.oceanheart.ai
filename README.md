# Watson

**Clinical LLM Output Review & Curation Tool**
*(part of Oceanheart.ai)*

---

## 1. Overview

**Watson** is a prototype application exploring how clinicians can effectively **review and refine LLM outputs** in psychotherapy and related well-being fields.
It provides an environment to:

* Review a model-generated **clinical summary** or note.
* **Edit** the text or per-section content with a rich editor.
* **Classify/label** issues (e.g., hallucination, missing risk content).
* **Submit** the review, generating a structured **diff**.
* View **basic analytics** (change rates, label frequencies).
* **Export** collected datasets for research and iteration.

The focus is on **process evaluation**, not clinical deployment.

---

## 2. Key Features

* **Rich text editing** (TipTap/ProseMirror) with support for strike-through, insertions, and sectioned content.
* **Labeling/classification panel** to tag issues in outputs.
* **Server-side diffing** (token + structural JSON) when edits are submitted.
* **Basic analytics dashboard**: change rates, label frequency, per-section heatmap.
* **Dataset export** (JSONL/CSV in a zip bundle with manifest).
* **Django Admin console** for operational review and curation.
* **Centralized Auth** via `passport.oceanheart.ai` JWTs.

---

## 3. Tech Stack

| Layer      | Technology                          | Notes                                             |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| Backend    | **Django 5** + DRF + HTMX           | Batteries-included MVC; lightweight interactivity |
| Frontend   | **TipTap** editor                   | ProseMirror-based rich-text editing               |
| Database   | **Postgres (Neon)**                 | JSONB for flexible storage + relational joins     |
| Auth       | **JWT from passport.oceanheart.ai** | RS256 verification middleware                     |
| Deployment | Render / Railway / Fly              | App server + Neon DB                              |
| Diffing    | `difflib`, `jsondiff`               | Token-level + structural JSON                     |

---

## 4. Data Model

* **Document** – source clinical note (raw JSON).
* **LLMOutput** – model-generated summary tied to a Document.
* **Edit** – clinician revision of an LLMOutput (with `edited_json`, diffs, status).
* **Label** – taxonomy of issue types (e.g., hallucination, missing\_risk).
* **EditLabel** – join table: which labels were applied to an Edit.

---

## 5. Core Workflow

1. **Seed**: A Document + LLMOutput is loaded.
2. **Edit**: Clinician opens the LLMOutput in TipTap, edits text/sections, applies labels.
3. **Submit**: Backend computes diffs (token + structural), stores immutable record.
4. **Review/Diff**: Diff viewer shows before/after changes.
5. **Analytics**: Simple dashboard of change rates + label frequencies.
6. **Export**: Generate a zip containing JSONL files of documents, outputs, edits, labels, and diffs.

---

## 6. Endpoints

* `GET /outputs/:id` → view output snapshot.
* `POST /edits` → create draft edit.
* `PUT /edits/:id` → save draft changes.
* `POST /edits/:id/submit` → finalize, compute diffs.
* `GET /edits/:id/diff` → return/render diff.
* `GET /analytics/basic` → JSON for dashboard.
* `POST /exports` → create export bundle.
* `GET /exports/:id` → download export.

---

## 7. Diffing

* **Text diff**: tokenized diff with insert/delete/replace ops.
* **Structural diff**: JSON node add/remove/replace/move with JSON pointers.
* Both are stored in `Edit.diff_text_json` and `Edit.diff_struct_json`.

---

## 8. Analytics (MVP)

* Change rate per section.
* Net length delta.
* Most frequent labels.
* Submission counts per clinician.

---

## 9. Export Format

```
manifest.json           # version, filters, timestamp, app_commit
documents.jsonl         # {doc_id, source, raw_json}
outputs.jsonl           # {output_id, doc_id, model, output_json, created_at}
edits.jsonl             # {edit_id, output_id, clinician_hash, edited_json,
                        #  diff_text_json, diff_struct_json, status}
labels.jsonl            # {edit_id, label_key, value}
README.txt
```

* Clinician IDs are hashed/salted.
* PHI should be stripped from raw documents before ingestion.

---

## 10. Installation

### Prerequisites

* Python 3.11+
* Postgres DB (Neon recommended)
* Node/npm (for TipTap assets)
* Redis (optional, for background tasks)

### Setup

```bash
git clone https://github.com/oceanheart-ai/watson
cd watson
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# env vars
export DATABASE_URL=postgresql://user:pass@host/db
export PASSPORT_JWKS_URL=https://passport.oceanheart.ai/.well-known/jwks.json

python manage.py migrate
python manage.py runserver
```

Frontend assets (TipTap) load via npm in `static/`.

---

## 11. Django Admin

* Manage Labels taxonomy.
* Review Edits inline with LLMOutputs.
* Diff preview widget in `EditAdmin`.
* Bulk export selected edits.

---

## 12. Roadmap

* **v0**: Review → Edit/Label → Submit → Diff → Analytics → Export.
* **v1**: Per-section editing; richer analytics; taxonomy versioning.
* **v2**: Multi-reviewer workflows, assignments, collaborative editing.

---

## 13. License

MIT License © 2025 Oceanheart.ai / Rick “Kai” Hallett.
See LICENSE for details.

---

## 14. Contact

* Website: [www.oceanheart.ai](https://www.oceanheart.ai)
* Lead developer: **Rick “Kai” Hallett**
* Email: [hello@oceanheart.ai](mailto:hello@oceanheart.ai)

---

Would you like me to also generate a **matching portfolio carousel card** (like I did for Preflight) with title/description/tech for Watson?


## Setup

### Python (UV)
```bash
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
```

### TypeScript/JavaScript (Bun)
```bash
bun install
bun run dev
```

### Ruby
```bash
bundle install
```

## Development

[Add development instructions here]

## Contributing

[Add contributing guidelines here]
