# Contributing to ScamShield AI 🛡️

Thank you for your interest in contributing to **ScamShield AI**! 

ScamShield AI is an open-source, elder-accessible decision-support assistant designed to empower older adults and their caregivers to identify, pause, and safely report fraudulent interactions.

---

## 🧭 Core Safety & Ethical Boundaries (Non-Negotiable)

To protect vulnerable populations and ensure absolute ethical compliance, all contributions must adhere to the following core guardrails:

1. **Voluntary Decision-Support Only:**
   - ScamShield AI must **never** execute automated bank transfers, payment cancellation, account locking, or automated financial transactions.
2. **Zero Call Interception & Audio Spying:**
   - ScamShield AI must **never** perform unauthorized background audio recording, carrier-level call interception, or wiretapping. Voice interactions are initiated solely via standard browser Web Speech APIs with explicit user activation.
3. **Zero Sensitive PII Retention:**
   - Never store or log Social Security Numbers, banking credentials, credit card numbers, passwords, or full phone numbers. All contact notifications must mask identifiable data.
4. **Mandatory Explicit Consent for Alerts:**
   - Any feature that drafts or simulates notifications to family members or caregivers must require an interactive, unchecked-by-default user confirmation (`explicit_consent: true`).
5. **Prompt Injection & Untrusted Input Safeguards:**
   - All user-submitted text must be treated as untrusted and wrapped in demarcation tags (`<untrusted_suspicious_message>`) before model evaluation.

---

## 🛠️ Local Development Setup (Windows / macOS / Linux)

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** and **npm 9+**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/[username]/ScamShield-AI.git
cd ScamShield-AI
```

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
# On Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# On Linux/macOS:
# python -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### 3. Frontend Setup (React + Vite + TypeScript)
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
- Application UI: `http://localhost:5173`

---

## 🧪 Testing & Validation Suite

Before opening a pull request, ensure all tests and linters pass cleanly:

### 1. Backend Tests (Pytest)
```bash
# From repository root
.\backend\.venv\Scripts\pytest.exe -v backend/tests
```
- All 35+ test cases must pass.
- Tests cover heuristics engine, AWS Bedrock integration, prompt injection defenses, fallback mechanisms, explicit consent verification, and FTC report generation.

### 2. Frontend Tests & Type Checking
```bash
# From frontend directory
cd frontend
npm test        # Unit tests for speech utilities and summary formatting
npm run lint    # Oxlint static analysis
npm run build   # TypeScript compilation (tsc -b) & production bundle
```

---

## 📐 Coding & Style Standards

- **Python Backend:**
  - Standard PEP 8 conventions.
  - Strict Pydantic models for all request and response payloads.
  - Maintain the provider abstraction layer (`BaseAssessmentProvider`). Do not hardcode external API calls in routes.
  - Keep default mode offline (`mock_synthetic`) so tests and local runs never require cloud credentials.
- **React Frontend:**
  - TypeScript with strict typing (no `any` without documented necessity).
  - WCAG AAA / AA accessible color contrast tokens and minimum 48px tap targets.
  - Respect 3-tier accessibility font sizes (`font-size-standard`, `font-size-large`, `font-size-xlarge`).
  - Graceful degradation if browser Web Speech API is unavailable.

---

## 📬 Submitting a Pull Request

1. Create a descriptive feature branch: `git checkout -b feature/accessible-feature-name`.
2. Commit your changes with clear commit messages: `git commit -m "feat: enhance warning sign categorization"`.
3. Push to your fork: `git push origin feature/accessible-feature-name`.
4. Open a Pull Request on GitHub detailing your changes, testing steps, and confirmation that safety guardrails are preserved.
