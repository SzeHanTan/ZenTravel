# ✈️ ZenTravel

**AI-driven travel disruption recovery, smart trip planning, and seamless booking management.**

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-BaaS-orange?style=for-the-badge&logo=firebase)
![GLM](https://img.shields.io/badge/AI-GLM--5.1-red?style=for-the-badge&logo=google-gemini)

*Your intelligent companion for navigating travel disruptions and orchestrating stress-free journeys.*

---

## 🌟 Overview

**ZenTravel** is a mobile-first travel companion designed to turn travel chaos into structured recovery. Built for the **Z.AI Hackathon**, the app utilizes the **GLM (ilmu-glm-5.1)** reasoning engine to bridge the gap between "what happened" and "what to do next." By combining a multi-stage **Brain Master** workflow with specialized AI agents, ZenTravel extracts data from messy inputs—like screenshots, PDFs, and emails—to generate actionable recovery plans and automate rebooking or compensation claims.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** (Latest LTS)
* **Firebase Project** (Firestore & Auth enabled)
* **Z.AI API Key** (GLM 5.1 access)
* **Android Studio** (For mobile builds via Capacitor)

### 1. Clone Repository
```bash
git clone [https://github.com/WYlim1003/ZenTravel.git]
cd zentravel/my-react-app

### 2. Install Dependencies
```bash
npm install

### 3. .env file
```bash
VITE_GLM_API_KEY=your_glm_key_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

### 4. Run application
```bash
npm run dev

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| 📱 **Frontend** | React 19 (TypeScript), Vite, Tailwind CSS |
| ☁️ **Backend / BaaS** | Firebase (Authentication, Firestore, Storage) |
| 🤖 **AI / Orchestrator** | Z.AI GLM 5.1 (via ILMU OpenAI-compatible API) |
| 📄 **Document Intel** | **Tesseract.js** (OCR) + **pdfjs-dist** (PDF Extraction) |
| 📦 **Mobile Runtime** | **Capacitor** (Android deployment) |
| 📧 **Delivery** | **EmailJS** (Recovery plan dispatch) |
| 🗺️ **Maps & Location** | Google Maps SDK (@react-google-maps/api) |

---

## 🧩 Core Architecture Patterns

### 1. 5-Stage Stateful Workflow (Brain Master)
The **Brain Master** orchestrator follows a tightly controlled pipeline to ensure AI reasoning stays grounded and actionable:

* **Stage 1 (Input Agent):** Extracts structured JSON from text/OCR/PDF evidence.
* **Stage 2 (Validation):** Pauses workflow if critical fields are missing to ask clarifying questions.
* **Stage 3-5 (ReAct Planner):** GLM decides which mock APIs (Flights, Hotels, Claims) to call, executes them, and observes results.
* **Stage 6 (Strategy):** Generates a final human-readable recovery strategy and "Plan of Action."

### 2. Human-in-the-Loop Approval
No high-stakes action is taken autonomously. Users must review and **approve/skip** suggested recovery steps (e.g., rebooking a flight or drafting a claim) before the system executes the final email dispatch or booking save.

### 3. Specialist Agent Model
Includes dedicated **Specialist Agents** for Flight, Hotel, Insurance, Trip, and Car domains. Each agent uses a strict JSON output contract to ensure consistent UI rendering and data persistence.

---

## ⚙️ Core System Implementations

### 🤖 Brain Master AI Pipeline
The primary feature of ZenTravel follows a sophisticated orchestration flow:
* **Multi-Modal Intake:** Supports raw text, image OCR, and PDF parsing via a custom `visionService`.
* **Context Persistence:** Stage-by-stage state tracking allows the agent to "resume" after user clarification without losing progress.
* **Safety Truncation:** Input is capped at 8,000 characters to ensure token efficiency and prevent hallucination.
* **Fallback Logic:** Regex-based extraction triggers if the GLM API is unreachable or times out.

### 📅 AI Trip Planner
* **Itinerary Generation:** Combines destination databases with GLM narratives to create day-by-day plans.
* **PDF Export:** Uses `jsPDF` for offline access, featuring sanitized text for cross-platform compatibility.

### 🏨 Smart Booking & Recommendations
* **Deterministic Mock APIs:** Provides repeatable flights, hotels, and compensation outcomes for demo reliability.
* **Zen AI Analysis:** Listens for "Cancelled" status in Firestore and automatically triggers a recommendation engine to suggest alternative routes or nearby accommodations.

---

## ⚠️ Challenges & Solutions

### 🔍 Unstructured Input Handling
> **Challenge:** Users upload blurry screenshots or complex PDF flight notices.
>
> **Solution:** Integrated client-side OCR (Tesseract.js) and PDF.js. If extraction is incomplete, the workflow enters a **paused state** to prompt the user for specific missing data.

### 🧠 Thinking-Model Management
> **Challenge:** Advanced LLMs like GLM can produce reasoning content but empty visible output, or hit token limits.
>
> **Solution:** `glmClient.ts` implements a custom handler to capture `reasoning_content` and **auto-retries** with an expanded token budget if a "length" finish reason occurs.

### 🛡️ Demo Reliability
> **Challenge:** External live travel APIs are often unstable or require expensive paid tiers.
>
> **Solution:** Developed a suite of **deterministic Mock Travel APIs** (`mockTravelAPI.ts`) that simulate real-world availability and pricing, ensuring the workflow is always functional for judging.

---
*Built with ❤️ for the Z.AI Hackathon to make travel safer, clearer, and smarter.*
