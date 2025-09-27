# Watson

**Clinical LLM Response Research Tool**
*(part of Oceanheart.ai)*

---

## 1. Overview

**Watson** is a research tool designed to collect and analyze differences between LLM-generated clinical assessments and clinician evaluations. Its purpose is to build datasets that help improve AI accuracy in mental health documentation.

The platform enables clinicians to:

* Review AI-generated **clinical assessments** (e.g., ACT formulations)
* **Edit** responses using a rich text editor (TipTap)
* Track **changes** between original and edited content
* Analyze **patterns** in how clinicians modify LLM outputs
* **Export** datasets for AI training and research (coming soon)

The focus is on **data collection for research**, not clinical deployment.

---

## 2. Key Features

* **Rich text editing** (TipTap/ProseMirror) for reviewing LLM responses
* **Diff analysis** showing what clinicians change in AI outputs
* **Review tracking** with status management (pending, in-review, completed)
* **Analytics dashboard** showing edit patterns and model performance
* **Demo ACT formulation** as example clinical content
* **Monochrome UI** with clean, instant-loading design
* **Research metrics** tracking edit rates and common modifications

---

## 3. Tech Stack

| Layer      | Technology                          | Notes                                             |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| Backend    | **Django 5** + DRF                  | REST API backend (HTMX planned but not implemented) |
| Frontend   | **React** + TypeScript + Vite       | SPA with component-based architecture             |
| Editor     | **TipTap** (ProseMirror)           | Rich text editing for clinical notes              |
| Styling    | **Tailwind CSS** + Monochrome      | Custom design system with glass morphism          |
| Runtime    | **Bun**                             | JavaScript runtime and package manager            |
| Database   | **Postgres** (planned)              | For production deployment                         |
| Auth       | **JWT from passport.oceanheart.ai** | Centralized authentication (planned)              |

---

## 4. Current Implementation

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── panels/
│   │   │   ├── ReviewsPanel.tsx    # Review tracking interface
│   │   │   ├── AnalyticsPanel.tsx  # Research analytics
│   │   │   ├── ProfilePanel.tsx    # User profile
│   │   │   └── SettingsPanel.tsx   # App settings
│   │   ├── layout/
│   │   │   └── MainPanel.tsx       # Main dashboard layout
│   │   └── tiptap-templates/       # Editor components
│   └── pages/
│       ├── LandingPage.tsx         # Research tool introduction
│       └── AppLayout.tsx           # Application shell
```

### Key Components

* **Reviews Panel**: Track LLM response reviews with edit percentages
* **Analytics Panel**: Visualize common edit patterns and model performance
* **TipTap Editor**: Review and edit ACT formulations and clinical assessments
* **Dashboard**: Research metrics and quick actions

---

## 5. Research Workflow

1. **LLM Generation**: AI generates clinical assessment (e.g., ACT formulation)
2. **Clinical Review**: Clinician reviews in TipTap editor
3. **Edit & Annotate**: Make corrections, add missing elements
4. **Track Changes**: System captures diff between original and edited
5. **Pattern Analysis**: Aggregate data shows common AI mistakes
6. **Export Dataset**: Research data for improving models (coming soon)

---

## 6. Installation

### Prerequisites

* Node.js 18+ (for compatibility, though we use Bun)
* Bun 1.0+
* Python 3.11+ (for backend)
* UV package manager (for Python)

### Frontend Setup

```bash
cd frontend
bun install
bun run dev          # Start Vite dev server on port 5173
```

### Backend Setup (In Progress)

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## 7. Development

### Frontend Commands

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run typecheck    # Run TypeScript type checking
bun test            # Run tests
```

### Code Style

* TypeScript with strict mode enabled
* React functional components with hooks
* Tailwind CSS for styling
* Component files use .tsx extension
* Follow existing monochrome design patterns

---

## 8. Demo Content

The application includes demo data showing:

* **ACT Case Formulation** example in the editor
* **Mock review data** showing different edit percentages
* **Analytics patterns** demonstrating common LLM issues:
  - Missing safety planning (68.5% of edits)
  - Lacking cultural factors (56.7% of edits)
  - Incorrect clinical terminology (50.4% of edits)

---

## 9. Architecture Decisions

### Why React instead of HTMX?

While the original spec called for HTMX, the current implementation uses React because:
- **Rich editor requirements**: TipTap integration is more mature in React
- **Complex UI interactions**: Analytics dashboards benefit from client-side state
- **Developer velocity**: Team expertise and component ecosystem
- **Future features**: Real-time collaboration easier with SPA architecture

### Migration Path

Future versions may explore:
- Hybrid approach (HTMX for simple pages, React for complex features)
- Server-side rendering with Next.js
- Progressive enhancement strategy

---

## 10. Roadmap

### Phase 1 (Current)
- ✅ Research-focused UI redesign
- ✅ Reviews and Analytics panels
- ✅ ACT formulation examples
- ✅ Demo data for research patterns

### Phase 2 (Next)
- [ ] Backend API implementation
- [ ] Real data persistence
- [ ] Authentication integration
- [ ] Diff calculation engine

### Phase 3 (Future)
- [ ] Dataset export functionality
- [ ] AI pattern analysis
- [ ] Multi-model comparison
- [ ] Research collaboration features

---

## 11. Contributing

This is a research prototype. Contributions should focus on:
- Improving data collection capabilities
- Enhancing diff analysis accuracy
- Adding clinical assessment templates
- Improving research analytics

Please maintain the monochrome design system and research-focused purpose.

---

## 12. License

MIT License © 2025 Oceanheart.ai / Rick "Kai" Hallett.
See LICENSE for details.

---

## 13. Contact

* Website: [www.oceanheart.ai](https://www.oceanheart.ai)
* Lead developer: **Rick "Kai" Hallett**
* Email: [hello@oceanheart.ai](mailto:hello@oceanheart.ai)

---

## Notes

This tool is for research purposes only. It is not intended for clinical use or patient care. All demo content is fictional and for illustration purposes only.