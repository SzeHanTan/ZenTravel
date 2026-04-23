export type WorkflowStage =
  | 'detection'
  | 'validation'
  | 'planning'
  | 'execution'
  | 'paused'
  | 'completed'
  | 'failed';

export interface TravelContext {
  userId: string;
  locale: string;
  currency: string;
  disruptionHistory: string[];
}

export interface IncidentInput {
  rawInput: string;
  source: 'chat' | 'email' | 'document' | 'image';
  timestamp: string;
}

export interface ExtractedIncident {
  summary: string;
  disruptionType: 'delay' | 'cancellation' | 'lost_luggage' | 'unknown';
  flightNumber?: string;
  origin?: string;
  destination?: string;
  originalDeparture?: string;
  confidence: number;
  missingFields: string[];
  ambiguityNotes: string[];
}

export interface WorkflowAction {
  id: string;
  agent: 'flight' | 'hotel' | 'compensation' | 'communication';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
}

export interface RecoveryPlan {
  strategy: string;
  priority: 'high' | 'medium' | 'low';
  userApprovalRequired: boolean;
  actions: WorkflowAction[];
}

export interface WorkflowFailure {
  stage: WorkflowStage;
  reason: string;
  recoverable: boolean;
  nextBestStep: string;
}

export interface StructuredWorkflowOutput {
  stage: WorkflowStage;
  incident: ExtractedIncident;
  reasoning: string[];
  clarifyingQuestions: string[];
  plan: RecoveryPlan | null;
  failures: WorkflowFailure[];
  finalMessage: string;
  metadata: {
    usedGLM: boolean;
    fallbackUsed: boolean;
    executionMs: number;
  };
}
