/**
 * ZenTravel Brain Master — 5-Stage Workflow Engine
 *
 * Stage 1 · Input Agent      GLM understands unstructured traveller message
 * Stage 2 · Validation       Rule-based check for missing critical fields
 * Stage 3 · ReAct: REASON    GLM decides which tools to call (tool planning)
 * Stage 4 · ReAct: ACT       App executes Travel API calls with GLM's parameters
 * Stage 5 · ReAct: OBSERVE   GLM synthesises API results into the recovery plan
 */

import { createGLMClientFromEnv } from '../services/glmClient';
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
  if (t.includes('cancel')) return 'cancellation';
  if (t.includes('delay') || t.includes('late')) return 'delay';
  if (t.includes('luggage') || t.includes('bag') || t.includes('lost')) return 'lost_luggage';
  return 'unknown';
}

function extractFlightNumber(text: string): string | undefined {
  return text.match(/\b([A-Z]{2}\s?-?\s?\d{2,4})\b/i)?.[1]
    ?.replace(/\s+/g, '').toUpperCase();
}

function extractRoute(text: string): { origin?: string; destination?: string } {
  const full = text.match(/from\s+([A-Za-z][\w\s]{1,25}?)\s+to\s+([A-Za-z][\w\s]{1,25}?)/i);
  if (full) return { origin: full[1].trim(), destination: full[2].trim() };
  
  const flightTo = text.match(/(?:flight|flying|fly)\s+to\s+([A-Za-z][\w\s]{1,25}?)/i);
  if (flightTo) return { destination: flightTo[1].trim() };
  
  return {};
}

function buildFallbackExtraction(input: IncidentInput): ExtractedIncident {
  const disruptionType = inferDisruptionType(input.rawInput);
  const flightNumber = extractFlightNumber(input.rawInput);
  const { origin, destination } = extractRoute(input.rawInput);

  const missing: string[] = [];
  if (!flightNumber) missing.push('flight number');
  if (!destination) missing.push('destination');

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

// ─── Stage 1: Input Agent (GLM) ───────────────────────────────────────────────

async function inputAgent(input: IncidentInput): Promise<{ incident: ExtractedIncident; usedGLM: boolean }> {
  const glm = createGLMClientFromEnv();
  if (!glm) return { incident: buildFallbackExtraction(input), usedGLM: false };

  try {
    const raw = await glm.complete([
      {
        role: 'system',
        content: `You are ZenTravel's Input Agent. Extract data into STRICT JSON: 
        {summary, disruptionType("delay"|"cancellation"|"lost_luggage"|"unknown"), flightNumber, origin, destination, confidence, missingFields[]}.`
      },
      { role: 'user', content: input.rawInput },
    ], 250);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as ExtractedIncident;
    return { incident: parsed, usedGLM: true };
  } catch (err) {
    console.error("Input Agent GLM Error:", err);
    return { incident: buildFallbackExtraction(input), usedGLM: false };
  }
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

export async function runHotelSearchWorkflow(destination: string, startDate: string, endDate: string, guests: number): Promise<StructuredWorkflowOutput> {
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

export async function runFlightSearchWorkflow(origin: string, destination: string, date: string, pax: number, fClass: string): Promise<StructuredWorkflowOutput> {
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