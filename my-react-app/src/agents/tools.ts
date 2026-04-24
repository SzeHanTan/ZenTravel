/**
 * ZenTravel Brain Master — ReAct Orchestration Engine
 * * Implements the full Reason → Act → Observe loop and 
 * handles specialized sourcing for Flights and Hotels.
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

// --- Helper Logic ---
function shouldFail(probability: number): boolean {
  return Math.random() < probability;
}

// ─── ReAct Step 1: GLM plans which tools to call ──────────────────────────────

const TOOL_PLANNING_SYSTEM = `You are ZenTravel's AI Orchestrator using the ReAct framework.
Given a travel disruption, reason about what data you need and output a JSON tool execution plan.

Available tools:
- search_flights: {"tool":"search_flights","params":{"from":"IATA","to":"IATA","count":3}}
- search_hotels:  {"tool":"search_hotels","params":{"airport":"IATA"}}
- check_compensation: {"tool":"check_compensation","params":{"type":"cancellation|delay|lost_luggage"}}

Return ONLY a JSON object:
{
  "reasoning": "One sentence: why these tools are needed.",
  "tools": [ ... ]
}

Rules:
- Use IATA codes (KUL, NRT, etc.)
- Max 3 tools total.`;

export interface ToolPlan {
  reasoning: string;
  tools: ToolCallPlan[];
}

export async function planToolCalls(incident: ExtractedIncident): Promise<ToolPlan> {
  const glm = createGLMClientFromEnv();
  if (!glm) return buildFallbackPlan(incident);

  try {
    const raw = await glm.complete([
      { role: 'system', content: TOOL_PLANNING_SYSTEM },
      { role: 'user', content: `Disruption: ${incident.disruptionType}. Route: ${incident.origin} to ${incident.destination}.` }
    ], 180);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ToolPlan;
  } catch {
    return buildFallbackPlan(incident);
  }
}

function buildFallbackPlan(incident: ExtractedIncident): ToolPlan {
  const from = incident.origin ?? 'KUL';
  const to = incident.destination ?? 'SIN';
  return {
    reasoning: "Standard recovery for route.",
    tools: [{ tool: 'search_flights', params: { from, to, count: 3 } }]
  };
}

// ─── ReAct Step 2: Execute tools ──────────────────────────────────────────────

export async function executeTools(plan: ToolPlan): Promise<ToolResult[]> {
  return Promise.all(plan.tools.map((call) => executeTool(call)));
}

// ─── ReAct Step 3: GLM synthesises tool results ───────────────────────────────

const SYNTHESIS_SYSTEM = `You are ZenTravel's AI Recovery Specialist. Return ONLY valid JSON:
{
  "observe": "One sentence summary.",
  "flight_options": "Numbered list with ⭐ for best.",
  "hotel_options": "Numbered list with ⭐ for best.",
  "compensation_summary": "Eligibility details.",
  "compensation_email": "Ready-to-send draft.",
  "traveller_summary": "Two sentence recommendation."
}`;

export interface SynthesisResult {
  observe: string;
  flight_options: string | null;
  hotel_options: string | null;
  compensation_summary: string | null;
  compensation_email: string | null;
  traveller_summary: string;
  usedGLM: boolean;
}

export async function synthesiseResults(incident: ExtractedIncident, toolResults: ToolResult[]): Promise<SynthesisResult> {
  const glm = createGLMClientFromEnv();
  if (!glm) throw new Error("GLM not found");

  try {
    const raw = await glm.complete([
      { role: 'system', content: SYNTHESIS_SYSTEM },
      { role: 'user', content: `Results: ${JSON.stringify(toolResults)}` }
    ], 400);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned) as SynthesisResult;
    result.usedGLM = true;
    return result;
  } catch (err) {
    throw new Error("Synthesis failed");
  }
}

// ─── Specialized Agents (Hotel, Flight, Compensation) ─────────────────────────

/**
 * HOTEL AGENT
 * Job A: Emergency Recovery
 * Job B: Standard Sourcing
 */
export async function hotelAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();
  const isSearch = incident.summary.toLowerCase().includes("search") && incident.disruptionType === 'unknown';

  if (isSearch) {
    if (!glm) return { id: 'h-err', agent: 'hotel', description: 'AI Source', status: 'failed', error: 'ILMU Client not found' };
    const prompt = [{
      role: 'system',
      content: `Return exactly 3 hotels in ${incident.destination} as minified JSON array: [{name, location, price, rating, description, amenities[], image_keyword}].`
    }];
    try {
      const response = await glm.complete(prompt as any);
      return { id: `hotel-source-${Date.now()}`, agent: 'hotel', description: 'Sourced hotels', status: 'completed', output: response.replace(/```json|```/g, "").trim() };
    } catch (error) {
      return { id: 'h-err', agent: 'hotel', description: 'AI Source', status: 'failed', error: 'Timeout' };
    }
  }

  // Original Emergency Logic
  if (incident.disruptionType !== 'cancellation' && incident.disruptionType !== 'delay') {
    return { id: 'hotel-backup', agent: 'hotel', description: 'Emergency accommodation', status: 'skipped', output: 'Not required.' };
  }
  return { id: 'hotel-backup', agent: 'hotel', description: 'Emergency accommodation', status: 'completed', output: 'Voucher for Airport Hotel reserved.' };
}

/**
 * FLIGHT AGENT
 * Job A: Emergency Rebooking
 * Job B: Standard Sourcing
 */
export async function flightAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();
  const isSearch = incident.summary.toLowerCase().includes("search") && incident.disruptionType === 'unknown';

  if (isSearch) {
    const prompt = [{
      role: 'system',
      content: `Sourcing agent. Find 3 flights from ${incident.origin} to ${incident.destination}. JSON array: [{airline, flightNum, price, timeDepart, timeLanding, duration}].`
    }];
    try {
      const response = await glm.complete(prompt as any);
      return { id: `flight-source-${Date.now()}`, agent: 'flight', description: 'Sourced flights', status: 'completed', output: response.replace(/```json|```/g, "").trim() };
    } catch (error) {
      return { id: 'f-err', agent: 'flight', description: 'AI Source', status: 'failed', error: 'Timeout' };
    }
  }

  // Emergency Logic
  if (!incident.destination) return { id: 'f-err', agent: 'flight', description: 'Search', status: 'failed', error: 'No destination' };
  return { id: 'flight-rebook', agent: 'flight', description: 'Search rebooking', status: 'completed', output: `ZT-221 ${incident.origin} to ${incident.destination}` };
}

export async function compensationAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const eligible = incident.disruptionType === 'cancellation' || incident.disruptionType === 'delay';
  return {
    id: 'comp-claim',
    agent: 'compensation',
    description: 'Compensation draft',
    status: eligible ? 'completed' : 'skipped',
    output: eligible ? 'Eligible for EUR 600.' : 'Not applicable.'
  };
}

export async function communicationAgent(_context: TravelContext, actions: WorkflowAction[]): Promise<WorkflowAction> {
  const completed = actions.filter((a) => a.status === 'completed').length;
  return {
    id: 'user-update',
    agent: 'communication',
    description: 'Summary',
    status: 'completed',
    output: `Recovery ready: ${completed} actions prepared.`
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function mapActionFailures(stage: 'planning' | 'execution', actions: WorkflowAction[]): WorkflowFailure[] {
  return actions
    .filter((a) => a.status === 'failed')
    .map((a) => ({
      stage,
      reason: `${a.agent} agent: ${a.error ?? 'failed'}`,
      recoverable: true,
      nextBestStep: 'Retry or contact support.'
    }));
}