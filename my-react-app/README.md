# ZenTravel — AI-Powered Travel Disruption Recovery System

> Built for the Z.AI Hackathon — GLM acts as the central reasoning engine across a 5-stage stateful workflow.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (React)                           │
│                                                                         │
│   [Brain Master Agent]   [Flight]  [Hotel]  [Insurance]  [Trip]  [Car] │
│          │                                                              │
│   Workflow Stage Progress Bar  ←  Live animated stepper (1→2→3→4→5)    │
│   Agent Activity Panel         ←  Per-agent running/completed/failed    │
│   WorkflowResponseCard         ←  Recovery plan with approve buttons    │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │  rawInput (unstructured natural language)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              5-STAGE STATEFUL WORKFLOW ENGINE  (workflowEngine.ts)      │
│                                                                         │
│  Stage 1 │ INPUT AGENT  ──────────────────────────────►  GLM Call #1   │
│           │   GLM parses free-text → ExtractedIncident JSON             │
│           │   (disruptionType, flightNumber, origin, destination,       │
│           │    confidence, missingFields, ambiguityNotes)               │
│           │                                                             │
│  Stage 2 │ VALIDATION                                                   │
│           │   Rule-based: missing destination or unknown type?          │
│           │   YES → return stage:"paused" + clarifyingQuestions[]       │
│           │   NO  → proceed                                             │
│           │                                                             │
│  ─── ReAct Loop (tools.ts) ─────────────────────────────────────────── │
│           │                                                             │
│  Stage 3 │ REASON ────────────────────────────────────►  GLM Call #2   │
│           │   GLM receives incident → outputs ToolPlan JSON             │
│           │   Decides: which tools? what IATA codes? count?             │
│           │   e.g. { tools: [search_flights, search_hotels,             │
│           │                  check_compensation] }                       │
│           │                                                             │
│  Stage 4 │ ACT  (deterministic — no GLM)                               │
│           │   App executes each tool in parallel:                       │
│           │   ├─ search_flights(KUL→NRT, count:3) → FlightOffer[]      │
│           │   ├─ search_hotels(airport:KUL)        → HotelOffer[]       │
│           │   └─ check_compensation(type:cancel)   → CompensationResult │
│           │                                                             │
│  Stage 5 │ OBSERVE ───────────────────────────────────►  GLM Call #3   │
│           │   GLM receives real tool results → synthesises plan         │
│           │   Picks ⭐ best flight, ⭐ best hotel,                       │
│           │   writes complete claim email (no placeholders),            │
│           │   outputs SynthesisResult JSON                              │
│           │                                                             │
│           └──► RecoveryPlan { actions[], strategy, priority }           │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────┐
│         MOCK TRAVEL API  (mockTravelAPI.ts)  │
│  Simulates Amadeus-style responses           │
│                                              │
│  CITY_TO_IATA  — city name normalisation     │
│  ROUTES        — 25+ KUL-* routes with       │
│                  airlines & base prices      │
│  AIRPORT_HOTELS — 15+ airports with 3        │
│                   hotel tiers each           │
│  COMPENSATION   — EU261/MY rules by type     │
└──────────────────────────────────────────────┘
```

---

## How GLM Enables the Workflow (Hackathon Requirements)

| Requirement | How ZenTravel satisfies it |
|---|---|
| **Understanding unstructured inputs** | Stage 1: GLM receives raw natural language and extracts a typed `ExtractedIncident` JSON with confidence scoring and ambiguity notes |
| **Multi-step reasoning across stages** | 5 explicit stages (Input → Validate → Reason → Act → Observe), each logged in `reasoning[]` and shown in the UI stage progress bar |
| **Dynamic task orchestration with tools** | Stage 3: GLM outputs a `ToolPlan` — it chooses *which* APIs to call and with *what parameters*. Stage 4 executes those exact calls |
| **Structured, actionable outputs** | Stage 5: GLM synthesises real API results into `SynthesisResult` — ranked flight list, hotel list, ready-to-send claim email |
| **Stateful workflow** | Returns `stage: "paused"` when data is missing; `"completed"` or `"failed"` after execution |
| **Edge case handling** | Stage 2 catches missing destination or unknown disruption type. Fallback functions activate if GLM is unavailable |

---

## GLM Dependency

All three GLM calls (`inputAgent`, `planToolCalls`, `synthesiseResults`) degrade gracefully if the API is unreachable — but without GLM:

- **Stage 1 fallback**: Regex-only extraction — misses nuanced phrasing, no confidence scoring
- **Stage 3 fallback**: Fixed tool list — cannot adapt to context (e.g. won't skip hotels for luggage incidents)
- **Stage 5 fallback**: Template string — no ⭐ recommendation logic, no natural-language explanation

> Removing GLM converts the system from an intelligent orchestrator into a deterministic script.

---

## Project Structure

```
src/
├── agents/
│   ├── workflowEngine.ts     # 5-stage orchestration logic (Stages 1–2 + ReAct coordinator)
│   ├── tools.ts              # ReAct Stages 3–5 (Reason / Act / Observe)
│   ├── specializedAgents.ts  # Domain agents: Flight, Hotel, Insurance, Trip, Car
│   └── types.ts              # Shared TypeScript interfaces
│
├── services/
│   ├── glmClient.ts          # ILMU-GLM-5.1 API client (timeout + retry logic)
│   ├── mockTravelAPI.ts      # Mock Amadeus: flights, hotels, compensation
│   └── geminiService.ts      # Gemini image recognition (trip planner feature)
│
├── components/
│   ├── WorkflowResponseCard.tsx  # Recovery plan UI with stage bar + approval cards
│   └── AgentResponseCard.tsx     # Specialist agent response UI
│
└── pages/
    └── ChatbotPage.tsx       # Main AI control page with live stage progress
```

---

## Environment Variables

Create `my-react-app/.env`:

```env
VITE_GLM_API_KEY=sk-your-ilmu-key-here
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_GOOGLE_MAPS_API_KEY=...
```

---

## Quick Start

```bash
cd my-react-app
npm install
npm run dev
```

Navigate to the **AI Control** page (ZenTravel → Trip Planner → AI Control), select **Brain Master**, and describe any flight disruption.

### Example inputs

```
My flight MH792 from Kuala Lumpur to Frankfurt was cancelled. Need rebooking and compensation.
```
```
Flight D7521 to Tokyo delayed 5 hours, I need a hotel near KLIA tonight.
```
```
I landed in Bali but my bag didn't arrive. Flight was AK388 from KUL.
```

---

## Architecture Decisions

- **ReAct pattern** (Reason → Act → Observe) chosen over single-shot prompting because it separates GLM's *reasoning* from deterministic *execution*, making each step auditable and testable independently.
- **Mock APIs** intentionally kept deterministic (same input = same output) so judges can reproduce results reliably.
- **Fallback at every GLM call** ensures the UI never breaks — degraded output still displays, making the GLM's contribution clearly visible by comparison.
- **Human-in-the-loop approval** — the `WorkflowResponseCard` requires the user to explicitly approve each recovery action before the system considers it executed.
