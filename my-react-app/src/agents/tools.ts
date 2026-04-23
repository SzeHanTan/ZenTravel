import type { ExtractedIncident, TravelContext, WorkflowAction, WorkflowFailure } from './types';

function shouldFail(probability: number): boolean {
  return Math.random() < probability;
}

export async function flightAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
  if (!incident.destination) {
    return {
      id: 'flight-rebook',
      agent: 'flight',
      description: 'Search alternative flights',
      status: 'failed',
      error: 'Missing destination; cannot query flight options.',
    };
  }

  if (shouldFail(0.12)) {
    return {
      id: 'flight-rebook',
      agent: 'flight',
      description: 'Search alternative flights',
      status: 'failed',
      error: 'Flight API timeout',
    };
  }

  return {
    id: 'flight-rebook',
    agent: 'flight',
    description: 'Search and hold a rebooking option',
    status: 'completed',
    output: `Reserved seat on ZT-221 from ${incident.origin ?? 'current airport'} to ${incident.destination}.`,
  };
}

export async function hotelAgent(incident: ExtractedIncident): Promise<WorkflowAction> {
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
