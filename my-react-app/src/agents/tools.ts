/**
 * ZenTravel Brain Master — ReAct Orchestration Engine
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

// --- Interfaces for Orchestration ---
export interface ToolPlan {
  reasoning: string;
  tools: ToolCallPlan[];
}

export interface SynthesisResult {
  observe: string;
  flight_options: string | null;
  hotel_options: string | null;
  compensation_summary: string | null;
  compensation_email: string | null;
  traveller_summary: string;
  usedGLM: boolean;
}

export interface ReActResult {
  toolPlan: ToolPlan;
  toolResults: ToolResult[];
  synthesis: SynthesisResult;
  actions: WorkflowAction[];
  reactSteps: string[];
}

// ─── ReAct Step 1: Planning ──────────────────────────────────────────────────

const TOOL_PLANNING_SYSTEM = `You are ZenTravel's AI Orchestrator. Output a JSON tool execution plan. 
Return ONLY JSON. Tools: search_flights, search_hotels, check_compensation.`;

export async function planToolCalls(incident: ExtractedIncident): Promise<ToolPlan> {
  const glm = createGLMClientFromEnv();
  if (!glm) return buildFallbackPlan(incident);

  try {
    const raw = await glm.complete([
      { role: 'system', content: TOOL_PLANNING_SYSTEM },
      { role: 'user', content: `Identify tools for: ${incident.summary}` }
    ], 180);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ToolPlan;
  } catch {
    return buildFallbackPlan(incident);
  }
}

function buildFallbackPlan(incident: ExtractedIncident): ToolPlan {
  return {
    reasoning: "Standard rebooking and compensation check.",
    tools: [
      { tool: 'search_flights', params: { from: incident.origin || 'KUL', to: incident.destination || 'SIN', count: 3 } },
      { tool: 'check_compensation', params: { type: incident.disruptionType } }
    ]
  };
}

// ─── ReAct Step 2: Execution ──────────────────────────────────────────────────

export async function executeTools(plan: ToolPlan): Promise<ToolResult[]> {
  return Promise.all(plan.tools.map((call) => executeTool(call)));
}

// ─── ReAct Step 3: Synthesis ──────────────────────────────────────────────────

const SYNTHESIS_SYSTEM = `You are ZenTravel's Recovery Specialist. Return ONLY valid JSON:
{
  "observe": "string",
  "flight_options": "string|null",
  "hotel_options": "string|null",
  "compensation_summary": "string|null",
  "compensation_email": "string|null",
  "traveller_summary": "string"
}`;

export async function synthesiseResults(incident: ExtractedIncident, toolResults: ToolResult[]): Promise<SynthesisResult> {
  const glm = createGLMClientFromEnv();
  if (!glm) throw new Error("GLM Client missing");

  const raw = await glm.complete([
    { role: 'system', content: SYNTHESIS_SYSTEM },
    { role: 'user', content: `Synthesize these results: ${JSON.stringify(toolResults)}` }
  ], 400);

  const cleaned = raw.replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned) as SynthesisResult;
  result.usedGLM = true;
  return result;
}

// ─── Helper: Convert Synthesis to Actions ─────────────────────────────────────

function synthesisToActions(result: SynthesisResult): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (result.flight_options) {
    actions.push({ id: 'flight-rebook', agent: 'flight', description: 'Flight options', status: 'completed', output: result.flight_options });
  }
  if (result.hotel_options) {
    actions.push({ id: 'hotel-backup', agent: 'hotel', description: 'Hotel options', status: 'completed', output: result.hotel_options });
  }
  if (result.compensation_email) {
    actions.push({ id: 'comp-claim', agent: 'compensation', description: 'Claim draft', status: 'completed', output: result.compensation_email });
  }
  
  actions.push({ id: 'user-update', agent: 'communication', description: 'Summary', status: 'completed', output: result.traveller_summary });

  return actions;
}

// ─── PUBLIC ORCHESTRATOR (The Missing Export) ────────────────────────────────

export async function runReActOrchestration(incident: ExtractedIncident): Promise<ReActResult> {
  // 1. REASON
  const toolPlan = await planToolCalls(incident);

  // 2. ACT
  const toolResults = await executeTools(toolPlan);

  // 3. OBSERVE & SYNTHESIZE
  const synthesis = await synthesiseResults(incident, toolResults);

  const actions = synthesisToActions(synthesis);

  const reactSteps = [
    `[REASON] ${toolPlan.reasoning}`,
    `[ACT] Executed: ${toolResults.map((r) => r.tool).join(', ')}`,
    `[OBSERVE] ${synthesis.observe}`,
  ];

  return { toolPlan, toolResults, synthesis, actions, reactSteps };
}

// ─── Specialized Search Agents ───────────────────────────────────────────────

export async function hotelAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();
  const isSearch = incident.summary.toLowerCase().includes("search");

  if (isSearch && glm) {
    const response = await glm.complete([{ role: 'system', content: `Find 3 hotels in ${incident.destination}. Return JSON array only.` }]);
    return { id: `h-${Date.now()}`, agent: 'hotel', description: 'Sourced', status: 'completed', output: response.replace(/```json|```/g, "").trim() };
  }
  return { id: 'h-skip', agent: 'hotel', description: 'Skip', status: 'skipped' };
}

export async function flightAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();
  const isSearch = incident.summary.toLowerCase().includes("search");

  if (isSearch && glm) {
    const response = await glm.complete([{ role: 'system', content: `Find 3 flights to ${incident.destination}. Return JSON array only.` }]);
    return { id: `f-${Date.now()}`, agent: 'flight', description: 'Sourced', status: 'completed', output: response.replace(/```json|```/g, "").trim() };
  }
  return { id: 'f-skip', agent: 'flight', description: 'Skip', status: 'skipped' };
}

export async function compensationAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  return { id: 'comp', agent: 'compensation', description: 'Check', status: 'skipped' };
}

export async function communicationAgent(_context: any, actions: WorkflowAction[]): Promise<WorkflowAction> {
  return { id: 'comm', agent: 'communication', description: 'Notify', status: 'completed', output: 'Recovery ready.' };
}

export function mapActionFailures(stage: 'planning' | 'execution', actions: WorkflowAction[]): WorkflowFailure[] {
  return actions.filter(a => a.status === 'failed').map(a => ({ stage, reason: `${a.agent}: ${a.error || 'failed'}`, recoverable: true, nextBestStep: 'Retry' }));
}