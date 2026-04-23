/**
 * ZenTravel Brain Master — ReAct Orchestration Engine
 *
 * Implements the full Reason → Act → Observe loop:
 *
 *  REASON  GLM analyses the incident and decides which tools to call
 *  ACT     App executes the mock Travel API calls with GLM's parameters
 *  OBSERVE GLM receives the real tool results and synthesises the recovery plan
 *
 * This satisfies all four hackathon criteria:
 *  1. Understanding unstructured inputs   ← handled by inputAgent (workflowEngine)
 *  2. Multi-step reasoning across stages  ← GLM Step 1: tool planning w/ explicit reasoning
 *  3. Dynamic task orchestration          ← GLM decides which tools to call + app executes
 *  4. Structured, actionable outputs      ← GLM Step 2: synthesises tool results into plan
 */

import { createGLMClientFromEnv } from '../services/glmClient';
import {
  executeTool,
  type FlightOffer,
  type HotelOffer,
  type CompensationResult,
  type ToolCallPlan,
  type ToolResult,
} from '../services/mockTravelAPI';
import type { ExtractedIncident, TravelContext, WorkflowAction, WorkflowFailure } from './types';

// ─── ReAct Step 1: GLM plans which tools to call ──────────────────────────────

const TOOL_PLANNING_SYSTEM = `You are ZenTravel's AI Orchestrator using the ReAct framework.
Given a travel disruption, reason about what data you need and output a JSON tool execution plan.

Available tools:
- search_flights: {"tool":"search_flights","params":{"from":"IATA","to":"IATA","count":3}}
- search_hotels:  {"tool":"search_hotels","params":{"airport":"IATA"}}
- check_compensation: {"tool":"check_compensation","params":{"type":"cancellation|delay|lost_luggage"}}

Return ONLY a JSON object (no markdown):
{
  "reasoning": "One sentence: why these tools are needed for this disruption.",
  "tools": [ ...tool calls array... ]
}

Rules:
- Use IATA airport codes (KUL, NRT, SIN, LHR, BKK, etc.)
- Include search_flights only if a flight rebooking is relevant
- Include search_hotels only for cancellation or delay  
- Include check_compensation only for cancellation, delay, or lost_luggage
- Max 3 tools total`;

export interface ToolPlan {
  reasoning: string;
  tools:     ToolCallPlan[];
}

async function planToolCalls(incident: ExtractedIncident): Promise<ToolPlan> {
  const glm = createGLMClientFromEnv();
  if (!glm) return buildFallbackPlan(incident);

  try {
    const raw = await glm.complete(
      [
        { role: 'system', content: TOOL_PLANNING_SYSTEM },
        {
          role: 'user',
          content:
            `Disruption: ${incident.disruptionType}\n` +
            `Flight: ${incident.flightNumber ?? 'unknown'}\n` +
            `From: ${incident.origin ?? 'unknown'} → To: ${incident.destination ?? 'unknown'}\n` +
            `Date: ${incident.originalDeparture ?? 'today'}\n` +
            `Message: "${incident.summary}"\n\n` +
            `Output the tool execution plan JSON.`,
        },
      ],
      180, // tiny — just a list of tool calls
    );

    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();
    const plan    = JSON.parse(cleaned) as ToolPlan;
    return plan;
  } catch {
    return buildFallbackPlan(incident);
  }
}

function buildFallbackPlan(incident: ExtractedIncident): ToolPlan {
  const from = incident.origin      ?? 'KUL';
  const to   = incident.destination ?? 'KUL';
  const type = incident.disruptionType;
  const tools: ToolCallPlan[] = [];

  if (type !== 'lost_luggage')
    tools.push({ tool: 'search_flights', params: { from, to, count: 3 } });
  if (type === 'cancellation' || type === 'delay')
    tools.push({ tool: 'search_hotels',  params: { airport: from } });
  if (type !== 'unknown')
    tools.push({ tool: 'check_compensation', params: { type } });

  return {
    reasoning: `Disruption type "${type}" on route ${from}→${to} requires ${tools.map((t) => t.tool).join(', ')}.`,
    tools,
  };
}

// ─── ReAct Step 2: Execute tools ──────────────────────────────────────────────

export async function executeTools(plan: ToolPlan): Promise<ToolResult[]> {
  return Promise.all(plan.tools.map((call) => executeTool(call)));
}

// ─── ReAct Step 3: GLM synthesises tool results ───────────────────────────────

const SYNTHESIS_SYSTEM = `You are ZenTravel's AI Recovery Specialist. Return ONLY valid JSON (no markdown):
{
  "observe": "One sentence: what the API data shows.",
  "flight_options": "Numbered list. Mark best with ⭐. Format: '[n]. [FlightNo] | [From]→[To] | +[Xh] | [Cabin] | MYR[price] | [N]seats'",
  "hotel_options": "Numbered list. Mark best with ⭐. Format: '[n]. [Name] | [dist] | [stars]★ | MYR[price]/night'",
  "compensation_summary": "2 sentences: eligibility + amount + deadline.",
  "compensation_email": "Ready-to-send email. Use ACTUAL flight/route/date from incident. Only [BRACKET] truly unknown info.",
  "traveller_summary": "2 sentences: best option recommendation with reason."
}
Set key to null if that tool was not called. Pick the BEST option with ⭐.`;

export interface SynthesisResult {
  observe:                string;
  flight_options:         string | null;
  hotel_options:          string | null;
  compensation_summary:   string | null;
  compensation_email:     string | null;
  traveller_summary:      string;
  usedGLM:                boolean;
}

async function synthesiseResults(
  incident:    ExtractedIncident,
  toolResults: ToolResult[],
): Promise<SynthesisResult> {
  const glm = createGLMClientFromEnv();
  if (!glm) return buildFallbackSynthesis(incident, toolResults);

  // Format tool results as readable text for GLM
  const toolContext = toolResults.map((r) => {
    if (r.tool === 'search_flights') {
      const flights = r.result as FlightOffer[];
      return `FLIGHTS FOUND:\n${flights.map((f, i) =>
        `  ${i + 1}. ${f.flightNumber} | ${f.from}→${f.to} | +${f.departIn} | ${f.cabin} | MYR ${f.priceMYR} | ${f.seatsLeft} seats`
      ).join('\n')}`;
    }
    if (r.tool === 'search_hotels') {
      const hotels = r.result as HotelOffer[];
      return `HOTELS FOUND:\n${hotels.map((h, i) =>
        `  ${i + 1}. ${h.name} | ${h.distance} | ${h.stars}★ | MYR ${h.priceMYR}/night | ${h.amenity}`
      ).join('\n')}`;
    }
    if (r.tool === 'check_compensation') {
      const comp = r.result as CompensationResult;
      return `COMPENSATION RULES:\n  Eligible: ${comp.eligible}\n  Amount: EUR ${comp.amountEUR} (MYR ${comp.amountMYR})\n  Regulation: ${comp.regulation}\n  Deadline: ${comp.claimDeadline}`;
    }
    return '';
  }).join('\n\n');

  try {
    const raw = await glm.complete(
      [
        { role: 'system', content: SYNTHESIS_SYSTEM },
        {
          role: 'user',
          content:
            `Incident: ${incident.disruptionType} — Flight ${incident.flightNumber ?? 'unknown'} ` +
            `from ${incident.origin ?? '?'} to ${incident.destination ?? '?'} on ${incident.originalDeparture ?? 'today'}.\n\n` +
            `TOOL RESULTS:\n${toolContext}\n\n` +
            `Generate the recovery plan JSON.`,
        },
      ],
      380, // enough for all fields; saves ~1-2s vs 480
    );

    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();
    const result  = JSON.parse(cleaned) as SynthesisResult;
    result.usedGLM = true;
    return result;
  } catch {
    return buildFallbackSynthesis(incident, toolResults);
  }
}

function buildFallbackSynthesis(
  incident:    ExtractedIncident,
  toolResults: ToolResult[],
): SynthesisResult {
  const fn   = incident.flightNumber ?? '[FLIGHT NUMBER]';
  const from = incident.origin       ?? '[ORIGIN]';
  const to   = incident.destination  ?? '[DESTINATION]';
  const date = incident.originalDeparture ?? '[DATE]';
  const type = incident.disruptionType;

  let flightOptions: string | null  = null;
  let hotelOptions:  string | null  = null;
  let compSummary:   string | null  = null;
  let compEmail:     string | null  = null;
  let bestFlight:    FlightOffer | undefined;
  let bestHotel:     HotelOffer | undefined;

  for (const r of toolResults) {
    if (r.tool === 'search_flights') {
      const flights = r.result as FlightOffer[];
      bestFlight = flights.find((f) => f.recommended) ?? flights[0];
      flightOptions = flights.map((f, i) =>
        `${f.recommended ? '⭐ ' : ''}${i + 1}. ${f.flightNumber} | ${f.from} → ${f.to} | Departs ${f.departIn} | ${f.cabin} | MYR ${f.priceMYR} | ${f.seatsLeft} seats left${f.note ? ` | ${f.note}` : ''}`
      ).join('\n');
    }
    if (r.tool === 'search_hotels') {
      const hotels = r.result as HotelOffer[];
      bestHotel = hotels.find((h) => h.recommended) ?? hotels[0];
      hotelOptions = hotels.map((h, i) =>
        `${h.recommended ? '⭐ ' : ''}${i + 1}. ${h.name} | ${h.distance} | ${h.stars}★ | MYR ${h.priceMYR}/night | ${h.amenity}`
      ).join('\n');
    }
    if (r.tool === 'check_compensation') {
      const comp = r.result as CompensationResult;
      if (comp.eligible) {
        compSummary =
          `You are eligible for up to EUR ${comp.amountEUR} (≈ MYR ${comp.amountMYR}) under ${comp.regulation}. ` +
          `Claim deadline: ${comp.claimDeadline}. ` +
          `Important: ${comp.conditions[0]}.`;

        // Fill in ALL known values — only bracket truly unknown fields
        compEmail =
          `Subject: Compensation Claim – Flight ${fn} ${type.charAt(0).toUpperCase() + type.slice(1)} – [YOUR FULL NAME]\n\n` +
          `Dear Customer Relations Team,\n\n` +
          `I am writing to formally request compensation for the ${type} of flight ${fn} ` +
          `from ${from} to ${to}${date !== '[DATE]' ? ` on ${date}` : ''}` +
          `, under ${comp.regulation}.\n\n` +
          `Under the regulation, passengers are entitled to EUR ${comp.amountEUR} for a ${type}. ` +
          `The disruption was not caused by extraordinary circumstances and I was not adequately notified in advance.\n\n` +
          `Please provide:\n` +
          `• Financial compensation of EUR ${comp.amountEUR} (or MYR ${comp.amountMYR})\n` +
          `• Written confirmation of your claims process and resolution timeline\n\n` +
          `Flight details: ${fn} | ${from} → ${to}${date !== '[DATE]' ? ` | ${date}` : ''}\n` +
          `Booking reference: [YOUR BOOKING REF]\n` +
          `Passenger name: [YOUR FULL NAME]\n` +
          `Contact: [YOUR EMAIL / PHONE]\n\n` +
          `Sincerely,\n[YOUR FULL NAME]`;
      }
    }
  }

  const recommendation = bestFlight
    ? `We recommend ${bestFlight.flightNumber} departing in ${bestFlight.departIn} (${bestFlight.cabin}, MYR ${bestFlight.priceMYR}) — soonest available with ${bestFlight.seatsLeft} seats left.${bestHotel ? ` For accommodation, ${bestHotel.name} at MYR ${bestHotel.priceMYR}/night is the top-rated option at ${from} airport.` : ''}`
    : `Your recovery options are ready for review and approval.`;

  return {
    usedGLM:              false,
    observe:              `Found ${toolResults.map((r) => `${r.tool.replace('_', ' ')}`).join(', ')} data for ${from} → ${to}.`,
    flight_options:       flightOptions,
    hotel_options:        hotelOptions,
    compensation_summary: compSummary,
    compensation_email:   compEmail,
    traveller_summary:    recommendation,
  };
}

// ─── Map synthesis → WorkflowActions ─────────────────────────────────────────

function synthesisToActions(result: SynthesisResult): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (result.flight_options !== null) {
    actions.push({
      id:          'flight-rebook',
      agent:       'flight',
      description: 'Alternative flight options (API results)',
      status:      'completed',
      output:      result.flight_options,
    });
  }

  if (result.hotel_options !== null) {
    actions.push({
      id:          'hotel-backup',
      agent:       'hotel',
      description: 'Emergency hotel options (API results)',
      status:      'completed',
      output:      result.hotel_options,
    });
  }

  if (result.compensation_email !== null) {
    actions.push({
      id:          'comp-claim',
      agent:       'compensation',
      description: 'Compensation claim email',
      status:      'completed',
      output:      result.compensation_email,
    });
  }

  actions.push({
    id:          'user-update',
    agent:       'communication',
    description: 'Recovery summary',
    status:      'completed',
    output:      result.traveller_summary,
  });

  return actions;
}

// ─── Public orchestration entry point ────────────────────────────────────────

export interface ReActResult {
  toolPlan:    ToolPlan;
  toolResults: ToolResult[];
  synthesis:   SynthesisResult;
  actions:     WorkflowAction[];
  reactSteps:  string[];
}

export async function runReActOrchestration(
  incident: ExtractedIncident,
): Promise<ReActResult> {
  // REASON: GLM decides which tools to call
  const toolPlan = await planToolCalls(incident);

  // ACT: App executes the tools
  const toolResults = await executeTools(toolPlan);

  // OBSERVE: GLM synthesises the real results
  const synthesis = await synthesiseResults(incident, toolResults);

  const actions = synthesisToActions(synthesis);

  const reactSteps = [
    `[REASON] ${toolPlan.reasoning}`,
    `[ACT] Executed tools: ${toolResults.map((r) => r.tool).join(', ')}`,
    `[OBSERVE] ${synthesis.observe}`,
  ];

  return { toolPlan, toolResults, synthesis, actions, reactSteps };
}

// ─── Legacy exports ───────────────────────────────────────────────────────────

export async function communicationAgent(
  _context: TravelContext,
  actions:  WorkflowAction[],
): Promise<WorkflowAction> {
  const completed = actions.filter((a) => a.status === 'completed').length;
  return {
    id:          'user-update',
    agent:       'communication',
    description: 'Recovery plan summary',
    status:      completed > 0 ? 'completed' : 'failed',
    output:      `Recovery plan ready — ${completed} action${completed !== 1 ? 's' : ''} prepared for approval.`,
  };
}

export function mapActionFailures(
  stage:   'planning' | 'execution',
  actions: WorkflowAction[],
): WorkflowFailure[] {
  return actions
    .filter((a) => a.status === 'failed')
    .map((a) => ({
      stage,
      reason:       `${a.agent} agent: ${a.error ?? 'did not complete'}`,
      recoverable:  true,
      nextBestStep: 'Use the dedicated specialist agent for step-by-step assistance.',
    }));
}
