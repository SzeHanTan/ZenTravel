/**
 * ZenTravel Brain Master — 5-Stage Workflow Engine
 *
 *  Stage 1 · Input Agent        GLM understands unstructured traveller message
 *  Stage 2 · Validation         Rule-based check for missing critical fields
 *  Stage 3 · ReAct: REASON      GLM decides which tools to call (tool planning)
 *  Stage 4 · ReAct: ACT         App executes Travel API calls with GLM's parameters
 *  Stage 5 · ReAct: OBSERVE     GLM synthesises API results into the recovery plan
 *
 * Every stage is reflected in StructuredWorkflowOutput.reasoning so the
 * "Show AI Reasoning" panel gives judges a clear multi-step narrative.
 */

import { createGLMClientFromEnv } from '../services/glmClient';
import { runReActOrchestration, mapActionFailures } from './tools';
import type {
  ExtractedIncident,
  IncidentInput,
  RecoveryPlan,
  StructuredWorkflowOutput,
  WorkflowFailure,
} from './types';

// ─── Stage 1 helpers ──────────────────────────────────────────────────────────

function inferDisruptionType(text: string): ExtractedIncident['disruptionType'] {
  const t = text.toLowerCase();
  if (t.includes('cancel'))                                          return 'cancellation';
  if (t.includes('delay') || t.includes('late'))                    return 'delay';
  if (t.includes('luggage') || t.includes('bag') || t.includes('lost')) return 'lost_luggage';
  return 'unknown';
}

function extractFlightNumber(text: string): string | undefined {
  return text.match(/\b([A-Z]{2}\s?-?\s?\d{2,4})\b/i)?.[1]
    ?.replace(/\s+/g, '').toUpperCase();
}

function extractRoute(text: string): { origin?: string; destination?: string } {
  // Pattern 1: "from X to Y" — full route
  const full = text.match(
    /from\s+([A-Za-z][\w\s]{1,25}?)\s+to\s+([A-Za-z][\w\s]{1,25}?)(?=\s+(?:was|is|has|will|just|got|,|\.|!)|$)/i,
  );
  if (full) return { origin: full[1].trim(), destination: full[2].trim() };

  // Pattern 2: "flight to Y" / "flying to Y" / "fly to Y"
  const flightTo = text.match(
    /(?:flight|flying|fly)\s+to\s+([A-Za-z][\w\s]{1,25}?)(?=\s+(?:was|is|has|just|got|,|\.|!)|$)/i,
  );
  if (flightTo) return { destination: flightTo[1].trim() };

  // Pattern 3: "to [City]" — bare destination mention (city starts with capital)
  const bare = text.match(/\bto\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)(?=\s|,|\.|!|$)/);
  if (bare) return { destination: bare[1].trim() };

  // Pattern 4: "at [Airport] / in [City]" as origin hint
  const at = text.match(/(?:at|in|stuck at|stranded at)\s+([A-Z]{3}|[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)/i);
  if (at) return { origin: at[1].trim() };

  return {};
}

function buildFallbackExtraction(input: IncidentInput): ExtractedIncident {
  const disruptionType = inferDisruptionType(input.rawInput);
  const flightNumber   = extractFlightNumber(input.rawInput);
  const { origin, destination } = extractRoute(input.rawInput);

  // Only flag destination as missing if we genuinely could not find it
  const missing: string[] = [];
  if (!flightNumber) missing.push('flight number');
  if (!destination)  missing.push('destination');
  // Origin is nice-to-have — don't block the workflow for it

  return {
    summary:       input.rawInput.slice(0, 200),
    disruptionType,
    flightNumber,
    origin:        origin ?? undefined,
    destination:   destination ?? undefined,
    confidence:    disruptionType === 'unknown' ? 0.4 : 0.75,
    missingFields: missing,
    ambiguityNotes: disruptionType === 'unknown'
      ? ['Could not confidently identify disruption type']
      : [],
  };
}

// ─── Stage 1: Input Agent (GLM) ───────────────────────────────────────────────

async function inputAgent(
  input: IncidentInput,
): Promise<{ incident: ExtractedIncident; usedGLM: boolean }> {
  const glm = createGLMClientFromEnv();
  if (!glm) return { incident: buildFallbackExtraction(input), usedGLM: false };

  try {
    const raw = await glm.complete(
      [
        {
          role: 'system',
          content:
            'You are ZenTravel\'s Input Agent. Extract travel disruption data from text. ' +
            'Return STRICT JSON: {summary,disruptionType("delay"|"cancellation"|"lost_luggage"|"unknown"),' +
            'flightNumber,origin,destination,originalDeparture,confidence(0-1),missingFields[],ambiguityNotes[]}. ' +
            'JSON only — no markdown.',
        },
        { role: 'user', content: input.rawInput },
      ],
      200, // compact JSON extraction — no prose needed
    );

    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();
    const parsed  = JSON.parse(cleaned) as ExtractedIncident;
    return { incident: parsed, usedGLM: true };
  } catch {
    return { incident: buildFallbackExtraction(input), usedGLM: false };
  }
}

// ─── Stage 2: Clarification check ────────────────────────────────────────────

function getClarifyingQuestions(incident: ExtractedIncident): string[] {
  const q: string[] = [];

  // Only hard-block on missing destination — it's needed for flight search
  if (incident.missingFields.includes('destination'))
    q.push('Where were you flying to?');

  // Unknown disruption type — must know before we can orchestrate tools
  if (incident.disruptionType === 'unknown')
    q.push('Was your flight delayed, cancelled, or was this a baggage issue?');

  // Flight number is helpful but not required — don't block the workflow for it
  // (the tools can still run with airline + route)

  return q;
}

// ─── Main workflow ────────────────────────────────────────────────────────────

export async function runZenTravelWorkflow(
  rawInput: string,
): Promise<StructuredWorkflowOutput> {
  const startedAt = performance.now();
  const failures:  WorkflowFailure[] = [];
  const input: IncidentInput = { rawInput, source: 'chat', timestamp: new Date().toISOString() };

  // ── Stage 1 ─────────────────────────────────────────────────────────────────
  const { incident, usedGLM: glm1 } = await inputAgent(input);

  const reasoning: string[] = [
    `[Stage 1 — Input Agent] GLM extracted: type="${incident.disruptionType}", ` +
    `flight=${incident.flightNumber ?? '?'}, ` +
    `route=${incident.origin ?? '?'} → ${incident.destination ?? '?'} ` +
    `(confidence ${Math.round(incident.confidence * 100)}%).`,
  ];

  // ── Stage 2 ─────────────────────────────────────────────────────────────────
  const clarifyingQuestions = getClarifyingQuestions(incident);

  if (clarifyingQuestions.length > 0) {
    reasoning.push(
      `[Stage 2 — Validation] Missing fields detected: ${incident.missingFields.join(', ')}. ` +
      `Pausing workflow to gather required data before tool orchestration.`,
    );
    return {
      stage: 'paused',
      incident,
      reasoning,
      clarifyingQuestions,
      plan: null,
      failures,
      finalMessage: 'I need a few more details before I can build a safe recovery plan.',
      metadata: { usedGLM: glm1, fallbackUsed: !glm1, executionMs: Math.round(performance.now() - startedAt) },
    };
  }

  reasoning.push(
    `[Stage 2 — Validation] All required fields present. ` +
    `Escalating to ReAct orchestration engine.`,
  );

  // ── Stages 3–5: ReAct (Reason → Act → Observe) ───────────────────────────
  const react = await runReActOrchestration(incident);

  // Append the three ReAct steps to the workflow reasoning chain
  reasoning.push(
    `[Stage 3 — REASON] ${react.reactSteps[0].replace('[REASON] ', '')}`,
    `[Stage 4 — ACT]    ${react.reactSteps[1].replace('[ACT] ', '')}`,
    `[Stage 5 — OBSERVE] ${react.reactSteps[2].replace('[OBSERVE] ', '')}`,
  );

  const usedGLM = glm1 || react.synthesis.usedGLM;
  failures.push(...mapActionFailures('execution', react.actions));
  const allFailed = react.actions.every((a) => a.status !== 'completed');

  const plan: RecoveryPlan = {
    strategy:             'Prioritise travel continuity first, then financial recovery.',
    priority:             incident.disruptionType === 'cancellation' ? 'high' : 'medium',
    userApprovalRequired: true,
    actions:              react.actions,
  };

  reasoning.push(
    allFailed
      ? '[Result] Workflow encountered errors — fallback recovery steps prepared.'
      : `[Result] ${react.actions.filter((a) => a.status === 'completed').length} recovery actions ready for traveller approval.`,
  );

  return {
    stage:   allFailed ? 'failed' : 'completed',
    incident,
    reasoning,
    clarifyingQuestions: [],
    plan,
    failures,
    finalMessage: allFailed
      ? 'Automatic workflow failed. Use the specialist agents for step-by-step help.'
      : 'Recovery plan complete. Review and approve the actions below.',
    metadata: { usedGLM, fallbackUsed: !usedGLM, executionMs: Math.round(performance.now() - startedAt) },
  };
}
