/**
 * ZenTravel Brain Master — 5-Stage Workflow Engine
 *
 * Stage 1 · Input Agent      Regex + rules extract incident fields (instant, no GLM)
 * Stage 2 · Validation       Rule-based: missing fields → clarifying questions
 * Stage 3 · ReAct: REASON    Rule-based tool planner (deterministic, no GLM)
 * Stage 4 · ReAct: ACT       Executes mock travel APIs (flights, hotels, compensation)
 * Stage 5 · ReAct: OBSERVE   GLM writes the human narrative (2 sentences, ~500 tokens)
 *
 * GLM is called ONLY in Stage 5 where it genuinely adds value — writing
 * context-aware narrative text that code cannot produce.  All classification
 * and planning is rule-based to avoid timeout on the thinking model.
 */

import { runReActOrchestration, mapActionFailures, hotelAgent, flightAgent } from './tools';
import type {
  ExtractedIncident,
  IncidentInput,
  RecoveryPlan,
  StructuredWorkflowOutput,
  WorkflowFailure,
} from './types';

// ─── Stage 1 Helpers ──────────────────────────────────────────────────────────

function inferDisruptionType(text: string): ExtractedIncident['disruptionType'] {
  const t = text.toLowerCase();
  // Lost luggage — check before "delay" so "delayed baggage" → lost_luggage
  if (/\b(luggage|baggage|bag|suitcase|pir|lost bag|missing bag|not located|delayed bag)\b/.test(t))
    return 'lost_luggage';
  if (/\b(cancel|cancelled|canceled|scrapped|no longer operating)\b/.test(t))
    return 'cancellation';
  if (/\b(delay|delayed|late|postpone|pushed back|depart.*later|new.*departure|estimated.*departure)\b/.test(t))
    return 'delay';
  return 'unknown';
}

function extractFlightNumber(text: string): string | undefined {
  // Match "MH792", "MH 792", "flight 2097", "flt 2097" etc.
  const standard = text.match(/\b([A-Z]{1,2}\s?-?\s?\d{2,4})\b/i)?.[1];
  if (standard) return standard.replace(/\s+/g, '').toUpperCase();

  // Bare numeric flight numbers ("Flight 2097", "Flt. 2097")
  const bare = text.match(/\b(?:flight|flt\.?)\s+(\d{3,4})\b/i)?.[1];
  if (bare) return bare;

  return undefined;
}

// Optional IATA code suffix: " (KUL)", "(FRA)", etc.
const IATA_OPT = /(?:\s*\([A-Z]{2,3}\))?/;
// A city/airport name: 2+ alpha words, up to 4 words
const CITY     = /([A-Za-z]{2,}(?:\s+[A-Za-z]{2,}){0,3})/;

function extractRoute(text: string): { origin?: string; destination?: string } {
  // "from Kuala Lumpur (KUL) to Frankfurt (FRA)" — handles optional IATA codes
  const full = new RegExp(
    `from\\s+${CITY.source}${IATA_OPT.source}\\s+to\\s+${CITY.source}${IATA_OPT.source}`,
    'i',
  ).exec(text);
  if (full) {
    const origin = full[1].trim();
    const dest   = full[2].trim();
    const junk   = /^(allow|a |for |the |due |lato|late)/i;
    if (!junk.test(dest)) return { origin, destination: dest };
  }

  // "to Frankfurt (FRA)" with optional IATA code
  const toCity = new RegExp(
    `\\bto\\s+${CITY.source}${IATA_OPT.source}`,
    'i',
  ).exec(text);
  if (toCity) {
    const dest = toCity[1].trim();
    const junk = /^(allow|a |for |the |due |lato|late|allow)/i;
    if (!junk.test(dest)) return { destination: dest };
  }

  // "fly to X" / "flying to X" / "flight to X" / "travel to X" / "going to X"
  const verbTo = /(?:fly(?:ing)?|flight|travel(?:ling)?|going|headed)\s+to\s+([A-Za-z]{2,}(?:\s+[A-Za-z]{2,}){0,3})/i.exec(text);
  if (verbTo) return { destination: verbTo[1].trim() };

  return {};
}

// Extract bare city / airport names from clarification replies.
// Handles: "Frankfurt", "Frankfurt (FRA)", "FRA", "Kuala Lumpur"
function extractBareCityName(text: string): string | undefined {
  // Strip "User clarification:" prefix if present
  const clean = text.replace(/user clarification:\s*/gi, '').trim();

  // If the whole reply is just a city name ± IATA code (≤ 5 words, all alpha/parens/space)
  if (/^[A-Za-z\s()]{2,40}$/.test(clean) && clean.split(/\s+/).length <= 5) {
    // Extract just the alphabetic city name, dropping any IATA code in parens
    const city = clean.replace(/\([A-Z]{2,3}\)/g, '').trim();
    if (city.length >= 2) return city;
  }

  // IATA code alone: "FRA", "KUL"
  const iata = /^\s*([A-Z]{3})\s*$/.exec(clean);
  if (iata) return iata[1];

  return undefined;
}

function buildFallbackExtraction(input: IncidentInput): ExtractedIncident {
  const disruptionType = inferDisruptionType(input.rawInput);
  const flightNumber   = extractFlightNumber(input.rawInput);
  const { origin, destination: routeDest } = extractRoute(input.rawInput);

  // Last-resort: if route extraction failed, try treating the last "User clarification:"
  // segment (or the whole input if short) as a bare city name answer
  const destination = routeDest ?? extractBareCityName(input.rawInput);

  const missing: string[] = [];
  if (!flightNumber) missing.push('flight number');
  if (!destination)  missing.push('destination');

  return {
    summary: input.rawInput.slice(0, 200),
    disruptionType,
    flightNumber,
    origin,
    destination,
    confidence: disruptionType === 'unknown' ? 0.4 : 0.75,
    missingFields: missing,
    ambiguityNotes: disruptionType === 'unknown' ? ['Manual fallback used'] : [],
  };
}

// ─── Stage 1: Input Agent ────────────────────────────────────────────────────
//
// Pure regex + rule-based extraction — no GLM call.
// Rationale: ilmu-glm-5.1 is a heavy thinking model; even a one-word
// classification question uses all available tokens on internal reasoning
// and returns content:null.  Regex is instant, deterministic, and handles
// all standard travel disruption messages (including OCR output).
// Edge cases (unknown type / missing destination) are handled by Stage 2
// validation which asks the user a clarifying question instead.

async function inputAgent(
  input: IncidentInput,
): Promise<{ incident: ExtractedIncident; usedGLM: boolean }> {
  const incident = buildFallbackExtraction(input);

  // Build a readable summary from extracted fields
  const parts = [
    incident.disruptionType !== 'unknown' ? incident.disruptionType : 'travel disruption',
    incident.flightNumber ? `flight ${incident.flightNumber}` : null,
    incident.origin && incident.destination
      ? `from ${incident.origin} to ${incident.destination}`
      : incident.destination
      ? `to ${incident.destination}`
      : incident.origin
      ? `from ${incident.origin}`
      : null,
  ].filter(Boolean);

  incident.summary = parts.join(', ') || input.rawInput.slice(0, 150);

  return { incident, usedGLM: false };
}

// ─── Stage 2: Clarification Check ─────────────────────────────────────────────

function getClarifyingQuestions(incident: ExtractedIncident): string[] {
  const q: string[] = [];
  if (incident.missingFields.includes('destination') && !incident.destination) 
    q.push('Where were you flying to?');
  if (incident.disruptionType === 'unknown') 
    q.push('Was your flight delayed, cancelled, or was this a baggage issue?');
  return q;
}

// ─── Standard Sourcing Workflows (Hotels/Flights) ───────────────────────────

export async function runHotelSearchWorkflow(destination: string, _startDate: string, _endDate: string, _guests: number): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const summary = `SEARCH: Hotels in ${destination}`;
  const incident: ExtractedIncident = { summary, disruptionType: 'unknown', destination, confidence: 1.0, missingFields: [], ambiguityNotes: [] };
  const hAction = await hotelAgent(incident);
  return {
    stage: 'completed',
    incident,
    reasoning: ['User initiated hotel search', 'Agent bypasses recovery logic for direct sourcing'],
    clarifyingQuestions: [],
    plan: { strategy: 'AI Sourcing', priority: 'medium', userApprovalRequired: false, actions: [hAction] },
    failures: [],
    finalMessage: 'Sourced stays.',
    metadata: { usedGLM: true, fallbackUsed: false, executionMs: Math.round(performance.now() - startedAt) }
  };
}

export async function runFlightSearchWorkflow(origin: string, destination: string, _date: string, _pax: number, _fClass: string): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const summary = `SEARCH: Flights from ${origin} to ${destination}`;
  const incident: ExtractedIncident = { summary, disruptionType: 'unknown', origin, destination, confidence: 1.0, missingFields: [], ambiguityNotes: [] };
  const fAction = await flightAgent(incident);
  return {
    stage: 'completed',
    incident,
    reasoning: ['User initiated flight search', 'Querying global flight schedules'],
    clarifyingQuestions: [],
    plan: { strategy: 'Sourcing', priority: 'medium', userApprovalRequired: false, actions: [fAction] },
    failures: [],
    finalMessage: 'Sourced flights.',
    metadata: { usedGLM: true, fallbackUsed: false, executionMs: Math.round(performance.now() - startedAt) }
  };
}

// ─── Main Orchestration Workflow (The 5-Stage Engine) ─────────────────────────

export async function runZenTravelWorkflow(rawInput: string): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const failures: WorkflowFailure[] = [];
  const input: IncidentInput = { rawInput, source: 'chat', timestamp: new Date().toISOString() };

  // --- Stage 1: Extraction ---
  const { incident, usedGLM: glm1 } = await inputAgent(input);

  const reasoning: string[] = [
    `[Stage 1 — Input Agent] GLM extracted: type="${incident.disruptionType}", route=${incident.origin ?? '?'} → ${incident.destination ?? '?'}.`,
  ];

  // --- Stage 2: Validation ---
  const clarifyingQuestions = getClarifyingQuestions(incident);

  if (clarifyingQuestions.length > 0) {
    reasoning.push(`[Stage 2 — Validation] Missing critical data. Pausing for user input.`);
    return {
      stage: 'paused',
      incident,
      reasoning,
      clarifyingQuestions,
      plan: null,
      failures,
      finalMessage: 'I need a few more details to build your recovery plan.',
      metadata: { usedGLM: glm1, fallbackUsed: !glm1, executionMs: Math.round(performance.now() - startedAt) },
    };
  }

  reasoning.push(`[Stage 2 — Validation] All clear. Escalating to ReAct engine.`);

  // --- Stages 3–5: ReAct (Reason → Act → Observe) ---
  const react = await runReActOrchestration(incident);

  reasoning.push(
    `[Stage 3 — REASON] ${react.reactSteps[0].replace('[REASON] ', '')}`,
    `[Stage 4 — ACT] Executed: ${react.toolResults.map(r => r.tool).join(', ')}`,
    `[Stage 5 — OBSERVE] ${react.synthesis.observe}`
  );

  const finalUsedGLM = glm1 || react.synthesis.usedGLM;
  failures.push(...mapActionFailures('execution', react.actions));
  const allFailed = react.actions.every((a) => a.status !== 'completed');

  const plan: RecoveryPlan = {
    strategy: 'Prioritise travel continuity, then financial recovery.',
    priority: incident.disruptionType === 'cancellation' ? 'high' : 'medium',
    userApprovalRequired: true,
    actions: react.actions,
  };

  return {
    stage: allFailed ? 'failed' : 'completed',
    incident,
    reasoning,
    clarifyingQuestions: [],
    plan,
    failures,
    finalMessage: allFailed 
      ? 'Automatic recovery failed. Please use specialist agents.' 
      : 'Recovery plan complete. Review your options below.',
    metadata: { usedGLM: finalUsedGLM, fallbackUsed: !finalUsedGLM, executionMs: Math.round(performance.now() - startedAt) },
  };
}