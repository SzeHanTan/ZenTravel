import type { ExtractedIncident, TravelContext, WorkflowAction, WorkflowFailure } from './types';
import { createGLMClientFromEnv } from '../services/glmClient';

function shouldFail(probability: number): boolean {
  return Math.random() < probability;
}

export async function hotelAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();

  const isSearch = incident.summary.toLowerCase().includes("search") && 
                   incident.disruptionType === 'unknown';

  if (isSearch) {
    if (!glm) return { id: 'h-err', agent: 'hotel', description: 'AI Source', status: 'failed', error: 'ILMU Client not found' };

    const prompt = [
      {
        role: 'system',
        content: `You are a high-speed travel API. 
        TASK: Return exactly 3 hotels in ${incident.destination}.
        RULES:
        1. Output ONLY a minified JSON array. No conversational text.
        2. description must be 1 sentence only.
        3. amenities must be max 3 items.
        4. Do not perform external research; use internal knowledge for speed.`
      },
      { role: 'user', content: `Fast-track hotel list for: ${incident.summary}` }
    ];
    try {
      // 🚀 Reduced hotel count and simplified descriptions make this much faster
      const response = await glm.complete(prompt as any);
      const cleanJson = response.replace(/```json|```/g, "").trim();
      return {
        id: `hotel-source-${Date.now()}`,
        agent: 'hotel',
        description: `Sourced hotels for ${incident.destination}`,
        status: 'completed',
        output: cleanJson
      };
    } catch (error: any) {
      return { id: 'h-err', agent: 'hotel', description: 'AI Source', status: 'failed', error: 'The AI took too long to respond. Try again.' };
    }
  }

  // --- JOB B: The Original Job (Emergency Recovery) ---
  // This part remains exactly as per your original logic
  if (incident.disruptionType !== 'cancellation' && incident.disruptionType !== 'delay') {
    return {
      id: 'hotel-backup',
      agent: 'hotel',
      description: 'Offer emergency accommodation',
      status: 'skipped',
      output: 'No accommodation action required for this disruption.',
    };
  }

  if (shouldFail(0.1)) {
    return {
      id: 'hotel-backup',
      agent: 'hotel',
      description: 'Offer emergency accommodation',
      status: 'failed',
      error: 'Hotel inventory service unavailable.',
    };
  }

  return {
    id: 'hotel-backup',
    agent: 'hotel',
    description: 'Reserve nearby hotel with late check-in',
    status: 'completed',
    output: 'Held a room near airport for one night with free cancellation.',
  };
}

/**
 * REFINED FLIGHT AGENT
 * Job A: Emergency Rebooking (Original)
 * Job B: Standard Sourcing (New)
 */
export async function flightAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const glm = createGLMClientFromEnv();

  // --- JOB B: Standard Flight Sourcing (New) ---
  const isSearch = incident.summary.toLowerCase().includes("search") && 
                   incident.disruptionType === 'unknown';

  if (isSearch) {
    if (!glm) return { id: 'f-err', agent: 'flight', description: 'AI Source', status: 'failed', error: 'ILMU Client not found' };

    const prompt = [
      {
        role: 'system',
        content: `You are a flight sourcing agent. Find 3 real flight options from ${incident.origin} to ${incident.destination}.
        Return ONLY a JSON array. Each object: {airline, flightNum, price, timeDepart, timeLanding, duration}.
        Times must be in string format (e.g., "23 April 2026 at 13:55:00 UTC+8").`
      },
      { role: 'user', content: incident.summary }
    ];

    try {
      const response = await glm.complete(prompt as any);
      const cleanJson = response.replace(/```json|```/g, "").trim();
      return {
        id: `flight-source-${Date.now()}`,
        agent: 'flight',
        description: `Sourced flights for ${incident.destination}`,
        status: 'completed',
        output: cleanJson
      };
    } catch (error: any) {
      return { id: 'f-err', agent: 'flight', description: 'AI Source', status: 'failed', error: error.message };
    }
  }

  // --- JOB A: Emergency Recovery (Original - Unchanged) ---
  if (!incident.destination) {
    return { id: 'f-err', agent: 'flight', description: 'Search alternative', status: 'failed', error: 'Missing destination' };
  }

  if (shouldFail(0.12)) {
    return { id: 'f-err', agent: 'flight', description: 'Search alternative', status: 'failed', error: 'Flight API timeout' };
  }

  return {
    id: 'flight-rebook',
    agent: 'flight',
    description: 'Search and hold a rebooking option',
    status: 'completed',
    output: `Reserved seat on ZT-221 from ${incident.origin ?? 'current airport'} to ${incident.destination}.`,
  };
}

/**
 * COMPENSATION AGENT: Original Logic
 */
export async function compensationAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  const eligible = incident.disruptionType === 'cancellation' || incident.disruptionType === 'delay';
  if (!eligible) {
    return {
      id: 'comp-claim',
      agent: 'compensation',
      description: 'Prepare compensation draft',
      status: 'skipped',
      output: 'Compensation is not applicable for this case.',
    };
  }

  return {
    id: 'comp-claim',
    agent: 'compensation',
    description: 'Draft compensation and insurance claim packet',
    status: 'completed',
    output: 'Generated claim packet with disruption timeline and reimbursement request.',
  };
}

/**
 * COMMUNICATION AGENT: Original Logic
 */
export async function communicationAgent(
  context: TravelContext,
  actions: WorkflowAction[],
): Promise<WorkflowAction> {
  const failedActions = actions.filter((action) => action.status === 'failed');
  const successfulActions = actions.filter((action) => action.status === 'completed');

  const statusText =
    failedActions.length > 0
      ? `Shared recovery progress with fallback steps. ${failedActions.length} action(s) need retry.`
      : 'Shared full action summary with confirmation links.';

  return {
    id: 'user-update',
    agent: 'communication',
    description: `Send structured update to traveler (${context.locale})`,
    status: successfulActions.length > 0 ? 'completed' : 'failed',
    output: statusText,
    error: successfulActions.length > 0 ? undefined : 'No successful action to communicate.',
  };
}

/**
 * FAILURE MAPPING: Original Logic
 */
export function mapActionFailures(stage: 'planning' | 'execution', actions: WorkflowAction[]): WorkflowFailure[] {
  return actions
    .filter((action) => action.status === 'failed')
    .map((action) => ({
      stage,
      reason: `${action.agent} agent failed: ${action.error ?? 'unknown error'}`,
      recoverable: true,
      nextBestStep: 'Ask user for approval to retry with fallback provider.',
    }));
}