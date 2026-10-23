# ScamShield AI - Repository File Manifest 📋

This document outlines the complete file inventory for the ScamShield AI project, categorizing all tracked assets for Git publication and detailing items explicitly excluded by `.gitignore`.

---

## 1. Tracked Repository Files (To Commit)

### Root Directory
- `.gitignore`: Comprehensive ignore rules for Python, Node.js, Vite, and Windows.
- `.env.example`: High-level configuration template for environment variables.
- `LICENSE`: Standard open-source MIT License.
- `README.md`: Primary documentation with overview, quickstart, testing, and disclosures.
- `CONTRIBUTING.md`: Contributor guide and safety/ethical standards.

### Documentation (`docs/`)
- `docs/ARCHITECTURE.md`: Technical architecture, scoring algorithm, API routes, and diagrams.
- `docs/HACKATHON.md`: Devpost submission text, demo video script, screenshot guide, and checklist.
- `docs/FILE_MANIFEST.md`: This file manifest and repository audit.

### Backend Application (`backend/`)
- `backend/.env.example`: Backend environment variable template with Bedrock settings.
- `backend/requirements.txt`: Python package dependencies (FastAPI, Boto3, Pydantic, Pytest).
- `backend/app/__init__.py`: App package initialization.
- `backend/app/config.py`: Application settings, environment loader, and guardrails.
- `backend/app/main.py`: FastAPI app entrypoint, CORS configuration, and `/health` route.
- `backend/app/models/__init__.py`: Models package initialization.
- `backend/app/models/assessment.py`: Pydantic models for assessment request, response, and red flags.
- `backend/app/models/incident.py`: Incident tracking and status models.
- `backend/app/models/alert.py`: Trusted-contact alert request and response models with consent validation.
- `backend/app/models/report.py`: Formal complaint report models and agency enumerations.
- `backend/app/services/__init__.py`: Services package initialization.
- `backend/app/services/assessment_engine.py`: Heuristics engine with scam hallmark scoring and negation handling.
- `backend/app/services/incident_store.py`: Thread-safe in-memory store pre-seeded with synthetic incidents.
- `backend/app/services/alert_service.py`: Consent validator and PII masking alert service.
- `backend/app/services/report_service.py`: Sanitized complaint generator for FTC, bank, and police.
- `backend/app/services/providers/__init__.py`: Provider package initialization.
- `backend/app/services/providers/base.py`: Abstract base class `BaseAssessmentProvider`.
- `backend/app/services/providers/synthetic_mock.py`: Offline heuristic provider implementation.
- `backend/app/services/providers/bedrock_provider.py`: AWS Bedrock `boto3` Claude 3 foundation model provider.
- `backend/app/services/providers/factory.py`: Dynamic provider resolver factory.
- `backend/app/api/__init__.py`: API router package initialization.
- `backend/app/api/routes_assessment.py`: Assessment endpoints (`/api/assess`, `/api/assess/scenarios`).
- `backend/app/api/routes_incidents.py`: Incident CRUD endpoints (`/api/incidents`, `/api/incidents/{id}`).
- `backend/app/api/routes_alerts.py`: Trusted-contact simulation endpoint (`/api/alerts/simulate`).
- `backend/app/api/routes_reports.py`: Formal complaint draft endpoint (`/api/reports/draft`).
- `backend/scripts/verify_bedrock_live.py`: Guarded live Bedrock invocation script with circuit breaker.
- `backend/tests/__init__.py`: Tests package initialization.
- `backend/tests/test_api.py`: FastAPI endpoint integration tests.
- `backend/tests/test_assessment_engine.py`: Unit and regression tests for the heuristics engine.
- `backend/tests/test_bedrock_provider.py`: AWS Bedrock provider unit tests and fallback verification.
- `backend/tests/test_report_service.py`: FTC and bank report drafting tests.
- `backend/tests/test_trusted_contact_flow.py`: Consent enforcement and PII masking unit tests.
- `backend/tests/test_verify_bedrock_script.py`: Unit tests for the live verification script.

### Frontend Application (`frontend/`)
- `frontend/.env.example`: Frontend environment variable template.
- `frontend/.gitignore`: Frontend-specific ignore file.
- `frontend/.oxlintrc.json`: Oxlint static analysis configuration.
- `frontend/package.json`: Node dependencies and build scripts.
- `frontend/package-lock.json`: Deterministic npm dependency lockfile.
- `frontend/index.html`: Accessible HTML5 root template with meta tags.
- `frontend/vite.config.ts`: Vite build and React plugin configuration.
- `frontend/tsconfig.json`: Root TypeScript configuration.
- `frontend/tsconfig.app.json`: App TypeScript compiler options.
- `frontend/tsconfig.node.json`: Node / Vite configuration compiler options.
- `frontend/README.md`: Frontend-specific documentation.
- `frontend/public/favicon.svg`: High-contrast shield favicon.
- `frontend/public/icons.svg`: SVG sprite definitions.
- `frontend/src/main.tsx`: React application entrypoint.
- `frontend/src/App.tsx`: Main application shell with mode and font-size state.
- `frontend/src/App.css`: Component layout styling.
- `frontend/src/index.css`: Core accessibility design tokens, themes, and typography.
- `frontend/src/types/index.ts`: TypeScript data contracts matching backend models.
- `frontend/src/services/api.ts`: Typed backend API client.
- `frontend/src/hooks/useSpeechRecognition.ts`: Web Speech API STT hook.
- `frontend/src/hooks/useSpeechSynthesis.ts`: Web Speech API TTS hook.
- `frontend/src/utils/speechUtils.ts`: Voice text-cleaning and spoken verdict formatting utilities.
- `frontend/src/components/Navbar.tsx`: Accessible header with font scaling and hotlines.
- `frontend/src/components/MockEngineNotice.tsx`: Prototype mock engine disclosure banner.
- `frontend/src/components/ChatAssessment.tsx`: Primary conversation input and threat card.
- `frontend/src/components/AlexaSimulatedAssistant.tsx`: Echo Show 10 multimodal simulation.
- `frontend/src/components/CoolingOffModal.tsx`: 15-minute countdown and calming breathing guide.
- `frontend/src/components/TrustedContactModal.tsx`: Explicit-consent-gated family alert simulator.
- `frontend/src/components/ReportDraftModal.tsx`: Official complaint draft generator.
- `frontend/src/components/IncidentDashboard.tsx`: Incident history tracking and detail drawer.
- `frontend/src/components/EducationalGuide.tsx`: Scam warning signs encyclopedia.
- `frontend/src/components/VoiceInputButton.tsx`: Accessible voice input trigger button.
- `frontend/src/components/ReadAloudPlayer.tsx`: Text-to-speech audio player control.
- `frontend/src/assets/hero.png`: Accessibility banner asset.
- `frontend/src/assets/react.svg`: React branding asset.
- `frontend/src/assets/vite.svg`: Vite branding asset.
- `frontend/test/speechRecognition.test.mjs`: Node test suite for speech recognition mappings.
- `frontend/test/speechUtils.test.mjs`: Node test suite for spoken summary formatting.

---

## 2. Excluded Files & Directories (Strictly Ignored via `.gitignore`)

| File / Folder Pattern | Reason for Exclusion |
| :--- | :--- |
| `.venv/`, `backend/.venv/` | Python virtual environments with platform-specific binaries. |
| `frontend/node_modules/` | Node package dependencies installed locally via npm. |
| `frontend/dist/` | Production build output generated by `npm run build`. |
| `.pytest_cache/`, `backend/.pytest_cache/` | Ephemeral test cache generated during pytest runs. |
| `__pycache__/` (all directories) | Compiled Python bytecode (`.pyc` files). |
| `.env`, `backend/.env`, `frontend/.env` | Local environment files that may contain sensitive credentials. |
| `*.bak`, `*.tmp` | Editor and system backup files. |
| `Thumbs.db`, `Desktop.ini` | Windows OS desktop and thumbnail caches. |
| `.vscode/*` (except `extensions.json`) | Local user IDE preferences. |
