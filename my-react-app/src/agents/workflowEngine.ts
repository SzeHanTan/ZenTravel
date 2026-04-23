import { createGLMClientFromEnv } from '../services/glmClient';
import {
  communicationAgent,
  compensationAgent,
  flightAgent,
  hotelAgent,
  mapActionFailures,
} from './tools';
import type {
  ExtractedIncident,
  IncidentInput,
  RecoveryPlan,
  StructuredWorkflowOutput,
  TravelContext,
  WorkflowAction,
  WorkflowFailure,
} from './types';

/** * --- ORIGINAL FUNCTIONS (PRESERVED) --- */

function inferDisruptionType(text: string): ExtractedIncident['disruptionType'] {
  const lower = text.toLowerCase();
  if (lower.includes('cancel')) return 'cancellation';
  if (lower.includes('delay')) return 'delay';
  if (lower.includes('luggage') || lower.includes('bag')) return 'lost_luggage';
  return 'unknown';
}

function extractFlightNumber(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{2}\s?-?\s?\d{2,4})\b/i);
  return match?.[1]?.replace(/\s+/g, '').toUpperCase();
}

function extractCities(text: string): { origin?: string; destination?: string } {
  const routeMatch = text.match(/from\s+([A-Za-z\s]+)\s+to\s+([A-Za-z\s]+)/i);
  if (!routeMatch) return {};
  return {
    origin: routeMatch[1].trim(),
    destination: routeMatch[2].trim(),
  };
}

function buildFallbackExtraction(input: IncidentInput): ExtractedIncident {
  const disruptionType = inferDisruptionType(input.rawInput);
  const flightNumber = extractFlightNumber(input.rawInput);
  const { origin, destination } = extractCities(input.rawInput);
  const missingFields: string[] = [];
  const ambiguityNotes: string[] = [];

  if (!flightNumber) missingFields.push('flight number');
  if (!origin) missingFields.push('origin');
  if (!destination) missingFields.push('destination');
  if (disruptionType === 'unknown') ambiguityNotes.push('Could not confidently infer disruption type.');

  return {
    summary: input.rawInput.slice(0, 180),
    disruptionType,
    flightNumber,
    origin,
    destination,
    confidence: disruptionType === 'unknown' ? 0.45 : 0.72,
    missingFields,
    ambiguityNotes,
  };
}

function getClarifyingQuestions(incident: ExtractedIncident): string[] {
  const questions: string[] = [];
  if (incident.missingFields.includes('flight number')) questions.push('Can you share the flight number?');
  if (incident.missingFields.includes('destination')) questions.push('Where were you flying to?');
  if (incident.disruptionType === 'unknown') questions.push('Was your flight delayed, cancelled, or was it a baggage issue?');
  return questions;
}

async function inputAgent(input: IncidentInput): Promise<{ incident: ExtractedIncident; usedGLM: boolean }> {
  const glm = createGLMClientFromEnv();
  if (!glm) return { incident: buildFallbackExtraction(input), usedGLM: false };
  try {
    const content = await glm.complete([{ role: 'system', content: 'Extract travel disruption fields. Return STRICT JSON.' }, { role: 'user', content: input.rawInput }]);
    const parsed = JSON.parse(content) as ExtractedIncident;
    return { incident: parsed, usedGLM: true };
  } catch {
    return { incident: buildFallbackExtraction(input), usedGLM: false };
  }
}

async function disruptionAnalysisAgent(incident: ExtractedIncident): Promise<string[]> {
  return [`Detected disruption type: ${incident.disruptionType}.`];
}

function userContextAgent(userId: string): TravelContext {
  return { userId, locale: 'en-MY', currency: 'MYR', disruptionHistory: [] };
}

function smartRecoveryEngine(incident: ExtractedIncident, clarifyingQuestions: string[]): RecoveryPlan | null {
  if (clarifyingQuestions.length > 0) return null;
  return {
    strategy: 'Prioritize itinerary continuity.',
    priority: incident.disruptionType === 'cancellation' ? 'high' : 'medium',
    userApprovalRequired: true,
    actions: [
      { id: 'flight-rebook', agent: 'flight', description: 'Alternative flight search', status: 'pending' },
      { id: 'hotel-backup', agent: 'hotel', description: 'Emergency accommodation', status: 'pending' }
    ],
  };
}

/** * --- NEW: HOTEL SEARCH WORKFLOW --- */
export async function runHotelSearchWorkflow(destination: string, startDate: string, endDate: string, guests: number): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const summary = `SEARCH: Hotels in ${destination} for ${guests} guests from ${startDate} to ${endDate}`;
  const incident: ExtractedIncident = { summary, disruptionType: 'unknown', destination, confidence: 1.0, missingFields: [], ambiguityNotes: [] };
  const hAction = await hotelAgent(incident);
  return {
    stage: 'completed',
    incident,
    reasoning: ['Agent identified standard search intent', 'Connecting to online sourcing tools'],
    clarifyingQuestions: [],
    plan: { strategy: 'AI Sourcing', priority: 'medium', userApprovalRequired: false, actions: [hAction] },
    failures: [],
    finalMessage: 'Sourced stays.',
    metadata: { usedGLM: true, fallbackUsed: false, executionMs: Math.round(performance.now() - startedAt) }
  };
}

/** * --- NEW: FLIGHT SEARCH WORKFLOW --- */
export async function runFlightSearchWorkflow(origin: string, destination: string, date: string, pax: number, fClass: string): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const summary = `SEARCH: Flights from ${origin} to ${destination} on ${date} for ${pax} in ${fClass}`;
  const incident: ExtractedIncident = { summary, disruptionType: 'unknown', origin, destination, confidence: 1.0, missingFields: [], ambiguityNotes: [] };
  const fAction = await flightAgent(incident);
  return {
    stage: 'completed',
    incident,
    reasoning: ['Consulting airline GDS', 'Retrieving flight availability'],
    clarifyingQuestions: [],
    plan: { strategy: 'Sourcing', priority: 'medium', userApprovalRequired: false, actions: [fAction] },
    failures: [],
    finalMessage: 'Sourced flights.',
    metadata: { usedGLM: true, fallbackUsed: false, executionMs: Math.round(performance.now() - startedAt) }
  };
}

/** * --- ORIGINAL WORKFLOW (PRESERVED) --- */
export async function runZenTravelWorkflow(rawInput: string, userId = 'anonymous-user'): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const failures: WorkflowFailure[] = [];
  const input: IncidentInput = { rawInput, source: 'chat', timestamp: new Date().toISOString() };
  const { incident, usedGLM } = await inputAgent(input);
  const reasoning = await disruptionAnalysisAgent(incident);
  const clarifyingQuestions = getClarifyingQuestions(incident);
  const context = userContextAgent(userId);
  const plan = smartRecoveryEngine(incident, clarifyingQuestions);

  if (!plan) {
    return { stage: 'paused', incident, reasoning, clarifyingQuestions, plan: null, failures, finalMessage: 'I need more detail.', metadata: { usedGLM, fallbackUsed: !usedGLM, executionMs: Math.round(performance.now() - startedAt) } };
  }

  const executedActions: WorkflowAction[] = [];
  executedActions.push(await flightAgent(incident));
  executedActions.push(await hotelAgent(incident));
  executedActions.push(await compensationAgent(incident));
  executedActions.push(await communicationAgent(context, executedActions));
  failures.push(...mapActionFailures('execution', executedActions));
  
  return { stage: 'completed', incident, reasoning, clarifyingQuestions: [], plan: { ...plan, actions: executedActions }, failures, finalMessage: 'Workflow complete.', metadata: { usedGLM, fallbackUsed: !usedGLM, executionMs: Math.round(performance.now() - startedAt) } };
}