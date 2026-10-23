# ScamShield AI - Hackathon Submission Package 🏆

> **Submission Guide & Materials for the Amazon Developer Hackathon / Devpost**

---

## 1. Project Overview & Elevator Pitch

- **Project Name:** ScamShield AI
- **Tagline:** An accessible scam-intervention assistant empowering older adults and caregivers to detect fraud, pause high-pressure coercion, and report scams safely.
- **Track / Focus:** AI for Good / Elder Care / Multimodal AI Assistants (Amazon Bedrock & Alexa+-style Multimodal Experience)

### Short Summary (150 words)
Every year, older adults lose billions of dollars to high-pressure imposter scams, grandchild emergency schemes, and fake bank security alerts. Scammers exploit adrenaline, urgency, and fear to compel immediate, irreversible financial transfers.

**ScamShield AI** is an elder-accessible, empathy-driven decision-support tool designed to intervene at the critical moment of pressure. Users can describe suspicious calls or text messages via voice or text, or test realistic synthetic presets. The system instantly evaluates the interaction across key fraud hallmarks—impersonation, urgency, secrecy, unconventional payment channels, and remote access—providing a threat score (0–100) and actionable, calm guidance.

Features include an interactive Echo Show 10 multimodal simulation with speech synthesis and recognition, a 15-minute calming cooling-off countdown with guided breathing, consent-gated trusted contact alerts, and pre-formatted fraud report drafts for the FTC, banks, and law enforcement.

---

## 2. Devpost Project Submission Write-Up

### 💡 Inspiration
According to the FTC and FBI Internet Crime Complaint Center (IC3), older adults lose upwards of $3.4 billion annually to fraud. Beyond the financial devastation, victims experience profound shame, anxiety, and loss of independence. 

Most cybersecurity solutions are built for IT professionals, relying on dense technical jargon, tiny fonts, and complex authentication flows. When an 80-year-old receives a terrifying call claiming their grandchild is in jail or their bank account is being drained, they don't need a lecture on cryptography—they need a clear, empathetic voice telling them to **STOP, take a breath, and verify independently**. We built ScamShield AI to bridge this critical gap.

### 🛡️ What It Does
- **Accessible Multimodal Assistant:** Designed with high-contrast color palettes, large buttons, a 3-tier accessibility font size switcher (`A`, `A+`, `A++`), and browser-native speech recognition and text-to-speech.
- **Multimodal Echo Show Simulation:** Demonstrates how an ambient smart display (like an Amazon Echo Show 10) can provide real-time audio-visual scam screening in the living room or kitchen.
- **Universal Scam Hallmark Detection:** Evaluates interactions against the 5 primary fraud indicators:
  1. *Authority / Entity Impersonation* (police, IRS, bank fraud department, grandchild)
  2. *Manufactured Artificial Urgency* ("within 1 hour", "don't hang up")
  3. *Forced Secrecy* ("don't tell your family", "don't talk to the bank teller")
  4. *Unconventional Payment* (gift cards, Bitcoin ATMs, wires to "safe accounts", cash couriers)
  5. *Remote Device Takeover* (demands to install AnyDesk, TeamViewer)
- **Voluntary 15-Minute Cooling-Off Period:** Features an interactive breathing exercise and countdown timer to counteract adrenaline-driven impulsive compliance.
- **Consent-Enforced Trusted-Contact Alerts:** Simulates alerting a designated son, daughter, or caregiver, strictly enforcing user consent and masking private contact information.
- **Formal Fraud Report Drafting:** Pre-fills official complaint letters for the FTC, banks, and local police with 1-click clipboard copy and `.txt` download.

### ⚙️ How We Built It
- **Dual-Provider Architecture:** Built with an extensible provider abstraction (`BaseAssessmentProvider`). By default, the app runs completely offline using a deterministic, rule-based synthetic heuristics engine (`SyntheticMockProvider`), requiring zero API keys or cloud setup. For cloud deployment, it includes an enterprise-grade AWS Bedrock provider (`BedrockAssessmentProvider`) using the official AWS SDK for Python (`boto3`) to invoke Anthropic Claude 3 Haiku or Claude 3.5 Sonnet.
- **Backend:** FastAPI, Pydantic v2 data models, and a thread-safe in-memory incident store.
- **Frontend:** React 19, TypeScript, Vite, Lucide React icons, and accessible CSS tokens.
- **Voice Capabilities:** Web Speech API (`SpeechRecognition` for voice input, `SpeechSynthesis` for read-aloud verdicts) with custom text-cleaning utilities to ensure natural spoken output without emojis or technical symbols.
- **Anti-Prompt-Injection Guardrails:** When calling AWS Bedrock, user input is wrapped in `<untrusted_suspicious_message>` tags, and the model is strictly bound by system directives never to follow instructions within user text or authorize financial transfers.

### 🛑 What Is Implemented vs. Simulated
To ensure absolute transparency and responsible AI disclosure:
- **Fully Implemented & Verifiable:**
  - Complete, functional FastAPI backend and React frontend.
  - 35 automated backend pytest cases and 10 frontend unit tests.
  - Production-ready AWS Bedrock `boto3` client provider with automatic fallback to local heuristics.
  - Web Speech API speech-to-text (voice microphone) and text-to-speech (read-aloud audio).
  - High-contrast, WCAG-compliant UI with font-size scaling.
  - Incident history tracking, cooling-off countdown timer, and report generation.
- **Simulated UI Experiences:**
  - **Echo Show 10 / "Alexa+" Interface:** This is an interactive browser UI simulation demonstrating how an ambient multimodal Alexa assistant would behave. It is powered by browser Web Speech APIs and FastAPI, rather than an official Alexa Skills Kit (ASK) or Alexa Voice Service (AVS) certified hardware endpoint.
  - **Trusted Contact Alerting:** The UI simulates drafting and dispatching alerts to family members. To protect privacy and prevent unintended spam during testing, no external cellular SMS or emails are sent.
  - **No Automated Banking Actions:** The app intentionally provides voluntary decision support only. It does not block bank accounts or intercept carrier-level phone calls by ethical design.

### 🧗 Challenges We Ran Into
- **Balancing Urgency with Reassurance:** Finding the right balance in the UI and voice responses so that older adults feel protected and alarmed enough to pause, without inducing overwhelming panic.
- **Context-Aware Heuristics:** Ensuring routine, non-fraudulent communications (such as a legitimate bank branch appointment reminder or doctor's appointment notice) do not trigger false-positive warnings or alarming "STOP PAYMENT" commands.
- **Safe Fallback Engineering:** Designing the Bedrock provider so that any transient AWS network issue or missing credentials fails gracefully back to the local engine without exposing errors or secrets to the user.

### 🏆 Accomplishments We're Proud Of
- Designing a genuinely accessible interface with high contrast, large touch targets, and 3-tier font scaling.
- Achieving 100% test pass rates across both Python and TypeScript test suites.
- Implementing dual-engine flexibility: judges can run the entire experience immediately offline with zero cloud configuration, or toggle to live Amazon Bedrock with a single setting.

### 📖 What We Learned
- Older adults respond far better to clear, simple directives ("Hang up and look at the number on the back of your card") than abstract cybersecurity warnings.
- The 15-minute cooling-off window is mathematically and psychologically the most effective countermeasure against social engineering fraud.

### 🚀 What's Next for ScamShield AI
- Developing an official certified Alexa Skill with multimodal APL (Alexa Presentation Language) for native Echo Show hardware.
- Exploring integration with Amazon Connect for secure, authorized caregiver callbacks.
- Multilingual accessibility support (Spanish, Mandarin, Tagalog) for diverse elder communities.

---

## 3. Concise Feature List

1. **Elder Accessibility Suite:** Standard, Large, and Extra-Large typography, WCAG AAA/AA contrast, min 48px tap targets.
2. **Echo Show 10 Multimodal Simulation:** Interactive animated Alexa visualizer with native speech-to-text and text-to-speech.
3. **Dual Provider Engine:** Seamless switching between offline synthetic heuristics and live Amazon Bedrock (Claude 3 Haiku).
4. **Universal Fraud Hallmark Analyzer:** Evaluates impersonation, urgency, secrecy, unconventional payments, and remote access.
5. **1-Click Synthetic Presets:** Six pre-seeded test scenarios (Bail Scam, Bank Safe Wire, AnyDesk Virus, IRS Threat, Utility Shutoff, Routine Notice).
6. **15-Minute Cooling-Off Module:** Interactive breathing animation, timer, and independent verification checklist.
7. **Consent-Gated Family Alerts:** Masked contact notifications requiring explicit affirmative opt-in.
8. **Formal Complaint Generator:** Formats actionable reports for the FTC, banks, and law enforcement.
9. **Incident History Dashboard:** Real-time logging with risk badges and status filtering.

---

## 4. Demo Video Script (< 3 Minutes)

**Total Duration:** 2 minutes 45 seconds  
**Tone:** Empathetic, confident, professional, elder-advocate

### Act 1: The Problem (0:00 – 0:25)
- **Visual:** Show news headlines or a graphic illustrating elder fraud ($3.4B lost annually). Transition to ScamShield AI homepage (`http://localhost:5173`).
- **Narrator (Spoken):** *"Every day, thousands of older adults receive terrifying phone calls: a panicked voice claiming their grandchild is in jail, or a fake bank agent insisting their life savings are under attack. Scammers rely on fear and artificial urgency to force rushed decisions. Today, we're introducing ScamShield AI—an accessible scam-intervention assistant built for older adults and their caregivers."*

### Act 2: Accessible UI & 1-Click Screening (0:25 – 1:05)
- **Visual:** Click the `A / A+ / A++` font switcher in the navbar to demonstrate accessibility scaling. Click **"Grandchild in Distress (Bail Scam)"** preset button. The form fills instantly with caller details and $4,500 Target gift card demand. Click **"Assess Threat & Get Guidance"**.
- **Narrator (Spoken):** *"ScamShield AI features a high-contrast, elder-friendly interface with instant font scaling and large tap targets. When a suspicious call occurs, the user or caregiver can describe it with text or voice. With one click, our engine analyzes the interaction across the key hallmarks of fraud. Instantly, we see a Critical Threat Score of 90/100, highlighting Authority Impersonation, Forced Secrecy, and Unconventional Payment via gift cards."*

### Act 3: Multimodal Alexa+ Simulation (1:05 – 1:45)
- **Visual:** Switch the toggle in the navbar to **"Alexa+ Simulated Mode"**. Show the Echo Show 10 display frame with its pulsing blue ring. Click the microphone ring or load the **"Bank Fraud Safe Account Wire"** scenario. The ring pulses, speech is processed, and the verdict is read aloud via speech synthesis.
- **Narrator (Spoken):** *"For ambient living room protection, we designed an Echo Show multimodal simulation. Using browser speech recognition and synthesis, an older adult can simply ask Alexa for help. The assistant analyzes the call in real time, visualizes the risk gauge, and delivers calm, spoken advice directly through the speaker: 'Hang up immediately. Chase Bank will never ask you to wire money to a safe account.'"*

### Act 4: Cooling-Off & Safety Workflows (1:45 – 2:20)
- **Visual:** Click **"Start 15-Min Cooling-Off"**. The modal opens showing the soothing animated breathing circle and 15:00 countdown timer. Next, open the **"Alert Family Contact"** modal; demonstrate that the alert is blocked until the **"I give explicit consent"** box is checked. Finally, open the **"Draft Fraud Report"** modal, selecting FTC format, and click **"Copy to Clipboard"**.
- **Narrator (Spoken):** *"ScamShield AI doesn't just diagnose fraud—it actively breaks the panic cycle. Our voluntary 15-minute cooling-off tool guides the senior through calming breathing exercises and an independent verification checklist. If they want family support, they can simulate an alert to their loved ones—with strictly enforced explicit consent. And when it's time to report the scam, ScamShield generates sanitized, ready-to-file complaint reports for the FTC and bank fraud departments."*

### Act 5: Architecture, Amazon Bedrock & Wrap-up (2:20 – 2:45)
- **Visual:** Briefly show the terminal running pytest (35 passed) or the architecture diagram. Return to the clean ScamShield AI dashboard.
- **Narrator (Spoken):** *"Under the hood, ScamShield AI runs a zero-cloud synthetic heuristics engine for complete offline privacy, paired with a production-grade Amazon Bedrock provider powered by Claude 3 Haiku for deep semantic analysis. All protected by strict anti-prompt-injection guardrails. ScamShield AI: empowering seniors, restoring peace of mind, and stopping scammers in their tracks. Thank you."*

---

## 5. Suggested Screenshots to Capture for Devpost

Capture these 6 high-resolution screenshots in your browser:

1. **Screenshot 1: Primary Assessment Screen (High Risk Detected)**
   - *URL:* `http://localhost:5173`
   - *State:* Load the **"Grandchild in Distress (Bail Scam)"** preset and run assessment.
   - *Highlights:* Red Critical Risk Banner, 90/100 gauge, detected red flag cards (Impersonation, Secrecy, Gift Cards), and Stop Payment guidance.
2. **Screenshot 2: Alexa+ Echo Show 10 Multimodal Simulation**
   - *URL:* `http://localhost:5173` (with Alexa+ mode toggled on)
   - *State:* Run the **"Bank Fraud Safe Account Wire"** scenario.
   - *Highlights:* Echo Show 10 device frame, glowing blue ring, conversational dialogue bubbles, and Auto-Speak toggle.
3. **Screenshot 3: 15-Minute Cooling-Off & Breathing Assistant**
   - *URL:* `http://localhost:5173` -> Click **"Take a 15-Min Cooling-Off Pause"**
   - *Highlights:* Animated breathing visualizer, 15:00 countdown clock, and independent verification checklist.
4. **Screenshot 4: Consent-Enforced Trusted Contact Alert**
   - *URL:* `http://localhost:5173` -> Click **"Alert Family Member"**
   - *Highlights:* Contact relationship dropdown, masked phone/email preview, and mandatory explicit consent checkbox.
5. **Screenshot 5: Official Fraud Report Drafting Screen**
   - *URL:* `http://localhost:5173` -> Click **"Draft Formal Fraud Report"**
   - *Highlights:* FTC / Bank / Police tab selector, structured sanitized complaint text, and "Copy Report" button.
6. **Screenshot 6: Incident History Dashboard**
   - *URL:* `http://localhost:5173` -> Click **"Incident History"** tab
   - *Highlights:* Filter buttons (All, High Risk, Cooling-Off, Resolved), summary statistics cards, and incident audit log.

---

## 6. Hackathon Submission Checklist

- [x] Working prototype running locally without crashes.
- [x] Comprehensive `README.md` with Windows setup instructions and portable relative commands.
- [x] Architecture document (`docs/ARCHITECTURE.md`) detailing frontend, backend, scoring engine, and API routes.
- [x] Transparent disclosure of implemented vs. simulated features.
- [x] MIT open-source `LICENSE` file.
- [x] Zero hardcoded secrets, tokens, or private credentials in the repository.
- [x] Root `.gitignore` excluding `.venv`, `node_modules`, `.pytest_cache`, and temporary files.
- [x] Full automated test suite passing (35 backend tests, 10 frontend tests, oxlint 0 warnings).
- [x] Recorded demo video (< 3 minutes) following the demo script.
- [x] Devpost submission text ready to paste.
