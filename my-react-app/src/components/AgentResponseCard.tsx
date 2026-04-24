import React, { useState } from 'react';
import type { SpecializedAgentOutput, AgentAction, AgentThinkStep } from '../agents/specializedAgents';

interface AgentResponseCardProps {
  output: SpecializedAgentOutput;
}

const ACTION_ICONS: Record<AgentAction['type'], string> = {
  email: '✉️',
  booking: '🎫',
  claim: '📋',
  itinerary: '🗺️',
  search_result: '🔍',
  document: '📄',
};

const STATUS_LABELS: Record<AgentAction['status'], { label: string; color: string }> = {
  completed: { label: 'Done', color: '#22c55e' },
  needs_approval: { label: 'Needs Approval', color: '#f59e0b' },
  draft: { label: 'Draft', color: '#7b2cbf' },
};

const ThinkingStep: React.FC<{ step: AgentThinkStep; index: number }> = ({ step, index }) => (
  <div className="arc-think-step">
    <div className="arc-think-badge">{index + 1}</div>
    <div className="arc-think-content">
      <div className="arc-think-row"><span className="arc-think-label">Thought</span><span>{step.thought}</span></div>
      <div className="arc-think-row"><span className="arc-think-label">Action</span><span>{step.action}</span></div>
      <div className="arc-think-row"><span className="arc-think-label">Observed</span><span>{step.observation}</span></div>
    </div>
  </div>
);

const ActionCard: React.FC<{ action: AgentAction }> = ({ action }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_LABELS[action.status];

  return (
    <div className="arc-action-card">
      <div className="arc-action-header" onClick={() => setExpanded((v) => !v)}>
        <div className="arc-action-title-row">
          <span className="arc-action-icon">{ACTION_ICONS[action.type]}</span>
          <span className="arc-action-title">{action.title}</span>
        </div>
        <div className="arc-action-right">
          <span className="arc-action-status" style={{ color: status.color }}>{status.label}</span>
          <span className="arc-action-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div className="arc-action-body">
          <pre className="arc-action-content">{action.content}</pre>
          {action.status === 'draft' && (
            <p className="arc-action-hint">Edit the fields in [BRACKETS] before sending.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const AgentResponseCard: React.FC<AgentResponseCardProps> = ({ output }) => {
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div className="arc-container">
      {/* Header */}
      <div className="arc-header">
        <div className="arc-agent-badge">
          <span className="arc-agent-dot" />
          {output.agentName}
        </div>
        {output.usedGLM && <span className="arc-glm-badge">GLM-Powered</span>}
      </div>

      {/* Clarifying questions */}
      {output.clarifyingQuestions.length > 0 && (
        <div className="arc-clarify-box">
          <p className="arc-clarify-title">I need a bit more info to help you:</p>
          <ul className="arc-clarify-list">
            {output.clarifyingQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {output.summary && <p className="arc-summary">{output.summary}</p>}

      {/* Action cards */}
      {output.actions.length > 0 && (
        <div className="arc-actions-section">
          <p className="arc-section-label">Actions Prepared</p>
          {output.actions.map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </div>
      )}

      {/* Next steps */}
      {output.nextSteps.length > 0 && (
        <div className="arc-nextsteps">
          <p className="arc-section-label">Next Steps</p>
          <ol className="arc-nextsteps-list">
            {output.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Thinking steps toggle */}
      {output.thinkingSteps.length > 0 && (
        <div className="arc-thinking-section">
          <button className="arc-thinking-toggle" onClick={() => setShowThinking((v) => !v)}>
            {showThinking ? '▲ Hide' : '▼ Show'} AI Reasoning ({output.thinkingSteps.length} steps)
          </button>
          {showThinking && (
            <div className="arc-thinking-steps">
              {output.thinkingSteps.map((step, i) => (
                <ThinkingStep key={i} step={step} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
