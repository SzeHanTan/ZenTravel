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
  if (incident.missingFields.includes('flight number')) {
    questions.push('Can you share the flight number?');
  }
  if (incident.missingFields.includes('destination')) {
    questions.push('Where were you flying to?');
  }
  if (incident.disruptionType === 'unknown') {
    questions.push('Was your flight delayed, cancelled, or was it a baggage issue?');
  }
  return questions;
}

async function inputAgent(input: IncidentInput): Promise<{ incident: ExtractedIncident; usedGLM: boolean }> {
  const glm = createGLMClientFromEnv();
  if (!glm) {
    return { incident: buildFallbackExtraction(input), usedGLM: false };
  }

  try {
    const content = await glm.complete([
      {
        role: 'system',
        content:
          'You are the ZenTravel Input Agent. Extract travel disruption fields from unstructured text. Return STRICT JSON with keys: summary, disruptionType, flightNumber, origin, destination, originalDeparture, confidence, missingFields (string[]), ambiguityNotes (string[]). disruptionType must be one of delay, cancellation, lost_luggage, unknown.',
      },
      {
        role: 'user',
        content: input.rawInput,
      },
    ]);

    const parsed = JSON.parse(content) as ExtractedIncident;
    return { incident: parsed, usedGLM: true };
  } catch {
    return { incident: buildFallbackExtraction(input), usedGLM: false };
  }
}

async function disruptionAnalysisAgent(incident: ExtractedIncident): Promise<string[]> {
  const reasoning: string[] = [];
  reasoning.push(`Detected disruption type: ${incident.disruptionType}.`);
  if (incident.confidence < 0.6) {
    reasoning.push('Low confidence extraction; trigger clarification branch.');
  }
  if (incident.disruptionType === 'cancellation') {
    reasoning.push('Cancellation impacts both transportation and accommodation workflows.');
  }
  if (incident.disruptionType === 'delay') {
    reasoning.push('Delay requires time-sensitive rebooking and compensation eligibility checks.');
  }
  return reasoning;
}

function userContextAgent(userId: string): TravelContext {
  return {
    userId,
    locale: 'en-MY',
    currency: 'MYR',
    disruptionHistory: [],
  };
}

function smartRecoveryEngine(incident: ExtractedIncident, clarifyingQuestions: string[]): RecoveryPlan | null {
  if (clarifyingQuestions.length > 0) {
    return null;
  }

  const actions: WorkflowAction[] = [
    {
      id: 'flight-rebook',
      agent: 'flight',
      description: 'Search and hold best flight alternative',
      status: 'pending',
    },
    {
      id: 'hotel-backup',
      agent: 'hotel',
      description: 'Secure contingency accommodation',
      status: 'pending',
    },
    {
      id: 'comp-claim',
      agent: 'compensation',
      description: 'Prepare compensation package',
      status: 'pending',
    },
  ];

  return {
    strategy: 'Prioritize itinerary continuity first, then financial recovery.',
    priority: incident.disruptionType === 'cancellation' ? 'high' : 'medium',
    userApprovalRequired: true,
    actions,
  };
}

export async function runZenTravelWorkflow(rawInput: string, userId = 'anonymous-user'): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const failures: WorkflowFailure[] = [];
  const input: IncidentInput = {
    rawInput,
    source: 'chat',
    timestamp: new Date().toISOString(),
  };

  const { incident, usedGLM } = await inputAgent(input);
  const reasoning = await disruptionAnalysisAgent(incident);
  const clarifyingQuestions = getClarifyingQuestions(incident);
  const context = userContextAgent(userId);
  const plan = smartRecoveryEngine(incident, clarifyingQuestions);

  if (!plan) {
    const pausedOutput: StructuredWorkflowOutput = {
      stage: 'paused',
      incident,
      reasoning,
      clarifyingQuestions,
      plan: null,
      failures,
      finalMessage: 'I need a bit more detail before I can execute a safe recovery workflow.',
      metadata: {
        usedGLM,
        fallbackUsed: !usedGLM,
        executionMs: Math.round(performance.now() - startedAt),
      },
    };
    return pausedOutput;
  }

  const executedActions: WorkflowAction[] = [];
  executedActions.push(await flightAgent(incident));
  executedActions.push(await hotelAgent(incident));
  executedActions.push(await compensationAgent(incident));
  executedActions.push(await communicationAgent(context, executedActions));

  failures.push(...mapActionFailures('execution', executedActions));
  const hasBlockingFailure = executedActions.every((action) => action.status !== 'completed');

  const output: StructuredWorkflowOutput = {
    stage: hasBlockingFailure ? 'failed' : 'completed',
    incident,
    reasoning: [
      ...reasoning,
      hasBlockingFailure
        ? 'Execution encountered full failure; workflow entered recovery mode.'
        : 'Execution completed with best-effort fallbacks where needed.',
    ],
    clarifyingQuestions: [],
    plan: {
      ...plan,
      actions: executedActions,
    },
    failures,
    finalMessage: hasBlockingFailure
      ? 'Workflow failed to complete automatically. I prepared retry steps and fallback providers.'
      : 'Workflow completed. Review the structured actions and approve final submissions.',
    metadata: {
      usedGLM,
      fallbackUsed: !usedGLM,
      executionMs: Math.round(performance.now() - startedAt),
    },
  };

  return output;
}
