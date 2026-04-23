import { createGLMClientFromEnv } from '../services/glmClient';

export type AgentType = 'flight' | 'hotel' | 'insurance' | 'trip' | 'car';

export interface AgentAction {
  type: 'email' | 'booking' | 'claim' | 'itinerary' | 'search_result' | 'document';
  title: string;
  content: string;
  status: 'completed' | 'needs_approval' | 'draft';
}

export interface AgentThinkStep {
  step: number;
  thought: string;
  action: string;
  observation: string;
}

export interface SpecializedAgentOutput {
  agentType: AgentType;
  agentName: string;
  stage: 'clarifying' | 'processing' | 'completed' | 'failed';
  thinkingSteps: AgentThinkStep[];
  clarifyingQuestions: string[];
  actions: AgentAction[];
  summary: string;
  nextSteps: string[];
  usedGLM: boolean;
}

// ─── System prompts per agent ────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AgentType, string> = {
  flight: `You are the ZenTravel Flight Concierge — a professional airline expert and customer advocate.
Your job: handle ALL flight-related issues including delays, cancellations, rebooking, upgrades, baggage, and compensation claims.

WORKFLOW (ReAct loop):
1. REASON about what the traveler needs
2. IDENTIFY missing info (flight number, route, date, ticket class)
3. ACT: search alternatives, draft emails, prepare compensation claims
4. OBSERVE results and adjust

OUTPUT: Return STRICT JSON with this exact shape:
{
  "thinkingSteps": [{"step":1,"thought":"...","action":"...","observation":"..."}],
  "clarifyingQuestions": [],
  "actions": [
    {"type":"email"|"booking"|"claim"|"search_result","title":"...","content":"...","status":"completed"|"needs_approval"|"draft"}
  ],
  "summary": "...",
  "nextSteps": ["..."]
}

If you need more info, put questions in clarifyingQuestions and leave actions empty.
For emails, write the FULL professional email text in content.
For bookings, list alternative flight options with times and prices.
For claims, write a complete compensation claim letter.`,

  hotel: `You are the ZenTravel Hotel Concierge — a professional hospitality expert.
Your job: handle ALL hotel-related issues including booking changes, early check-in/late check-out, upgrades, cancellations, complaints, and emergency accommodation.

WORKFLOW (ReAct loop):
1. REASON about the traveler's hotel situation
2. IDENTIFY missing info (hotel name, booking ref, dates, location, reason)
3. ACT: find alternatives, draft request emails, calculate refunds
4. OBSERVE and refine

OUTPUT: Return STRICT JSON:
{
  "thinkingSteps": [{"step":1,"thought":"...","action":"...","observation":"..."}],
  "clarifyingQuestions": [],
  "actions": [
    {"type":"email"|"booking"|"search_result"|"document","title":"...","content":"...","status":"completed"|"needs_approval"|"draft"}
  ],
  "summary": "...",
  "nextSteps": ["..."]
}

Write full professional emails. For accommodation searches, list 3 nearby options with price per night.`,

  insurance: `You are the ZenTravel Insurance Claims Specialist — an expert in travel insurance policies and claims processing.
Your job: evaluate claim eligibility, prepare claim documents, draft claim submission emails, and guide the traveler through the claims process.

WORKFLOW (ReAct loop):
1. REASON about what happened and what coverage applies
2. IDENTIFY needed documents (policy number, receipts, medical reports, flight proof)
3. ACT: assess eligibility, draft claim form, write submission email, list required documents
4. OBSERVE: flag any gaps or issues

OUTPUT: Return STRICT JSON:
{
  "thinkingSteps": [{"step":1,"thought":"...","action":"...","observation":"..."}],
  "clarifyingQuestions": [],
  "actions": [
    {"type":"claim"|"email"|"document","title":"...","content":"...","status":"completed"|"needs_approval"|"draft"}
  ],
  "summary": "...",
  "nextSteps": ["..."]
}

Be specific about coverage amounts and timelines. Draft complete, ready-to-send claim letters.`,

  trip: `You are the ZenTravel Trip Planner — a creative and practical travel itinerary expert.
Your job: plan detailed day-by-day itineraries, suggest activities, handle itinerary changes, find alternatives when plans fall through, and optimise trips for budget/pace/preferences.

WORKFLOW (ReAct loop):
1. REASON about destination, dates, budget, and traveler style
2. IDENTIFY missing details (destination, duration, budget, interests, party size)
3. ACT: build itinerary, suggest activities, provide transport tips
4. OBSERVE: check for conflicts or improvements

OUTPUT: Return STRICT JSON:
{
  "thinkingSteps": [{"step":1,"thought":"...","action":"...","observation":"..."}],
  "clarifyingQuestions": [],
  "actions": [
    {"type":"itinerary"|"search_result"|"document","title":"...","content":"...","status":"completed"|"needs_approval"|"draft"}
  ],
  "summary": "...",
  "nextSteps": ["..."]
}

Format itineraries day-by-day. Include estimated costs, timings, and local tips.`,

  car: `You are the ZenTravel Car Rental Specialist — an expert in vehicle rentals, breakdowns, disputes, and road trip logistics.
Your job: handle car rental bookings, extensions, upgrades, breakdown reports, disputes with rental companies, and alternative transport when cars fail.

WORKFLOW (ReAct loop):
1. REASON about the rental situation
2. IDENTIFY missing info (rental company, booking ref, vehicle type, location, issue)
3. ACT: find alternatives, draft dispute/complaint emails, file breakdown reports
4. OBSERVE and refine

OUTPUT: Return STRICT JSON:
{
  "thinkingSteps": [{"step":1,"thought":"...","action":"...","observation":"..."}],
  "clarifyingQuestions": [],
  "actions": [
    {"type":"email"|"booking"|"document"|"search_result","title":"...","content":"...","status":"completed"|"needs_approval"|"draft"}
  ],
  "summary": "...",
  "nextSteps": ["..."]
}

Write assertive but professional dispute emails. For alternatives, list 3 options with rental rates.`,
};

const AGENT_NAMES: Record<AgentType, string> = {
  flight: 'Flight Concierge',
  hotel: 'Hotel Concierge',
  insurance: 'Insurance Claims Specialist',
  trip: 'Trip Planner',
  car: 'Car Rental Specialist',
};

// ─── Fallback outputs per agent when GLM is unavailable ──────────────────────

function buildFallback(agentType: AgentType, userInput: string): SpecializedAgentOutput {
  const lower = userInput.toLowerCase();

  const fallbackActions: Record<AgentType, AgentAction[]> = {
    flight: [
      {
        type: 'search_result',
        title: 'Alternative Flights Found',
        content: 'ZT-221 | Kuala Lumpur → Destination | Departs +4h | Economy MYR 480\nZT-305 | Kuala Lumpur → Destination | Departs +7h | Economy MYR 380',
        status: 'needs_approval',
      },
      {
        type: 'email',
        title: 'Compensation Claim Email (Draft)',
        content: 'Dear Customer Relations,\n\nI am writing to formally request compensation for flight disruption experienced on [DATE]. Due to [DELAY/CANCELLATION], I was unable to travel as scheduled.\n\nPlease process my compensation claim under EU261/2004 or applicable regulations.\n\nBooking Reference: [REF]\nFlight: [FLIGHT NUMBER]\n\nYours sincerely,\n[Your Name]',
        status: 'draft',
      },
    ],
    hotel: [
      {
        type: 'search_result',
        title: 'Nearby Hotels Available',
        content: '1. Airport Transit Hotel — MYR 220/night ⭐⭐⭐⭐ (0.3km)\n2. Garden Inn Express — MYR 180/night ⭐⭐⭐ (1.2km)\n3. Comfort Suites — MYR 310/night ⭐⭐⭐⭐⭐ (2km)',
        status: 'needs_approval',
      },
      {
        type: 'email',
        title: 'Hotel Extension Request (Draft)',
        content: 'Dear Front Desk Manager,\n\nI am currently a guest at your property (Room [NUMBER], Check-in [DATE]).\n\nDue to unforeseen travel disruption, I would like to request a room extension for [NUMBER] additional night(s).\n\nKindly advise on availability and the applicable rate.\n\nThank you for your assistance.\n[Your Name]',
        status: 'draft',
      },
    ],
    insurance: [
      {
        type: 'claim',
        title: 'Claim Eligibility Assessment',
        content: lower.includes('delay') || lower.includes('cancel')
          ? '✅ ELIGIBLE — Travel delay/cancellation is covered.\n\nEstimated reimbursement: MYR 500–2,000\nRequired documents:\n• Original booking receipt\n• Airline disruption notice\n• Boarding pass\n• Receipts for additional expenses'
          : '⚠️ PENDING REVIEW — More information needed to confirm eligibility.',
        status: 'completed',
      },
      {
        type: 'email',
        title: 'Insurance Claim Submission (Draft)',
        content: 'Dear Claims Department,\n\nI wish to submit a travel insurance claim for the following incident:\n\nPolicy Number: [POLICY NUMBER]\nIncident Date: [DATE]\nIncident Type: [DELAY/CANCELLATION/MEDICAL]\nDescription: [DESCRIBE WHAT HAPPENED]\n\nPlease find attached the required supporting documents.\n\nI request prompt processing of my claim.\n\nSincerely,\n[Your Name]',
        status: 'draft',
      },
    ],
    trip: [
      {
        type: 'itinerary',
        title: 'Sample 3-Day Itinerary',
        content: 'DAY 1 — Arrival & City Exploration\n• Morning: Check in, rest\n• Afternoon: City centre walk, local market\n• Evening: Rooftop dinner with city views\n\nDAY 2 — Cultural Immersion\n• Morning: Heritage district tour\n• Afternoon: Museum + street food lunch\n• Evening: Night market\n\nDAY 3 — Nature & Departure\n• Morning: Botanical garden / nature park\n• Afternoon: Souvenir shopping\n• Evening: Departure',
        status: 'needs_approval',
      },
    ],
    car: [
      {
        type: 'search_result',
        title: 'Alternative Vehicles Available',
        content: '1. Toyota Vios (Economy) — MYR 120/day | Available now\n2. Honda City (Mid-size) — MYR 160/day | Available +2h\n3. Toyota Innova (MPV) — MYR 220/day | Available now',
        status: 'needs_approval',
      },
      {
        type: 'email',
        title: 'Rental Dispute Letter (Draft)',
        content: 'Dear [Rental Company] Customer Service,\n\nI am writing regarding booking reference [REF] for a vehicle rented on [DATE].\n\nI wish to formally dispute [ISSUE: unexpected charges / vehicle condition / breakdown handling].\n\nI request immediate resolution including [REFUND/REPLACEMENT/EXPLANATION].\n\nPlease respond within 48 hours.\n\n[Your Name]',
        status: 'draft',
      },
    ],
  };

  return {
    agentType,
    agentName: AGENT_NAMES[agentType],
    stage: 'completed',
    thinkingSteps: [
      { step: 1, thought: `Received request: "${userInput.slice(0, 80)}..."`, action: 'Parsing intent', observation: 'Identified relevant travel issue.' },
      { step: 2, thought: 'Checking available tools and templates.', action: 'Loading domain knowledge', observation: 'Fallback mode active (GLM unavailable).' },
    ],
    clarifyingQuestions: [],
    actions: fallbackActions[agentType],
    summary: `Here are the best available options for your ${agentType} request. Review and approve any action before submitting.`,
    nextSteps: ['Review the drafts above', 'Edit any placeholder fields (shown in [BRACKETS])', 'Approve and send'],
    usedGLM: false,
  };
}

// ─── Parse GLM JSON response safely ──────────────────────────────────────────

interface RawGLMOutput {
  thinkingSteps?: AgentThinkStep[];
  clarifyingQuestions?: string[];
  actions?: AgentAction[];
  summary?: string;
  nextSteps?: string[];
}

function parseGLMResponse(raw: string): Omit<SpecializedAgentOutput, 'agentType' | 'agentName' | 'usedGLM'> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in GLM response');

  const parsed = JSON.parse(jsonMatch[0]) as RawGLMOutput;
  const clarifyingQuestions: string[] = parsed.clarifyingQuestions ?? [];
  const actions: AgentAction[] = parsed.actions ?? [];

  return {
    stage: clarifyingQuestions.length > 0 ? 'clarifying' : 'completed',
    thinkingSteps: parsed.thinkingSteps ?? [],
    clarifyingQuestions,
    actions,
    summary: parsed.summary ?? '',
    nextSteps: parsed.nextSteps ?? [],
  };
}

// ─── Main specialized agent runner ───────────────────────────────────────────

export async function runSpecializedAgent(
  agentType: AgentType,
  userInput: string,
): Promise<SpecializedAgentOutput> {
  const glm = createGLMClientFromEnv();

  if (!glm) {
    return buildFallback(agentType, userInput);
  }

  try {
    const raw = await glm.complete([
      { role: 'system', content: SYSTEM_PROMPTS[agentType] },
      { role: 'user', content: userInput },
    ]);

    const parsed = parseGLMResponse(raw);

    return {
      agentType,
      agentName: AGENT_NAMES[agentType],
      usedGLM: true,
      ...parsed,
    };
  } catch {
    return buildFallback(agentType, userInput);
  }
}
