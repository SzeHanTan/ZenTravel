import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import '../styles/ChatbotPage.css';
import '../styles/AgentResponseCard.css';
import { runZenTravelWorkflow } from '../agents/workflowEngine';
import { runSpecializedAgent } from '../agents/specializedAgents';
import type { AgentType, SpecializedAgentOutput } from '../agents/specializedAgents';
import type { StructuredWorkflowOutput, WorkflowAction } from '../agents/types';
import { AgentResponseCard } from '../components/AgentResponseCard';
import { WorkflowResponseCard } from '../components/WorkflowResponseCard';
import mascotMain from '../assets/MASCOT-removebg-preview.png';
import mascotHotel from '../assets/MASCOT1.png';
import mascotCar from '../assets/MASCOT2.png';
import mascotInsurance from '../assets/MASCOT3.png';
import mascotTrip from '../assets/MASCOT4.png';
import mascotFlight from '../assets/MASCOT5.png';

interface ChatbotPageProps {
  setView: (v: string) => void;
}

type ActiveAgent = 'master' | AgentType;

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  specializedOutput?: SpecializedAgentOutput;
  workflowOutput?: StructuredWorkflowOutput;
}

type AgentPanelStatus = 'pending' | 'running' | 'completed' | 'failed';

interface AgentPanelEntry {
  status: AgentPanelStatus;
  activityText: string;
}

const PANEL_AGENTS = [
  { key: 'master', label: 'Brain Master', mascot: mascotMain,       color: '#7b2cbf' },
  { key: 'flight', label: 'Flight Agent', mascot: mascotFlight,     color: '#9d8977' },
  { key: 'hotel',  label: 'Hotel Agent',  mascot: mascotHotel,      color: '#a8948f' },
  { key: 'claims', label: 'Claims Agent', mascot: mascotInsurance,  color: '#b3a682' },
] as const;

const DEFAULT_PANEL: Record<string, AgentPanelEntry> = {
  master: { status: 'pending', activityText: 'Ready to orchestrate' },
  flight: { status: 'pending', activityText: 'Awaiting task' },
  hotel:  { status: 'pending', activityText: 'Awaiting task' },
  claims: { status: 'pending', activityText: 'Awaiting task' },
};

const AGENT_CONFIG: Record<AgentType, { label: string; color: string; placeholder: string; mascot: string }> = {
  flight: {
    label: 'FLIGHTS',
    color: '#9d8977',
    placeholder: 'e.g. My flight MH370 from KL to Tokyo was cancelled, need rebooking',
    mascot: mascotFlight,
  },
  hotel: {
    label: 'HOTELS',
    color: '#a8948f',
    placeholder: 'e.g. I need to extend my stay at Grand Hyatt KL by 2 nights',
    mascot: mascotHotel,
  },
  insurance: {
    label: 'INSURANCE',
    color: '#b3a682',
    placeholder: 'e.g. My flight was delayed 6 hours, how do I file a claim?',
    mascot: mascotInsurance,
  },
  trip: {
    label: 'TRIP',
    color: '#8d9d8f',
    placeholder: 'e.g. Plan a 5-day trip to Tokyo for a couple, budget MYR 8000',
    mascot: mascotTrip,
  },
  car: {
    label: 'CAR',
    color: '#7d8fa8',
    placeholder: 'e.g. My rental car broke down in Penang, what should I do?',
    mascot: mascotCar,
  },
};

const SUGGESTED_PROMPTS: Record<ActiveAgent, string[]> = {
  master: [
    'Flight MH370 from KL to Tokyo was cancelled, need help',
    'My connecting flight was missed due to a 3-hour delay',
    'Hotel overbooked despite my confirmed reservation',
  ],
  flight: [
    'Rebook my cancelled flight MH123 to next available',
    'My flight was delayed 4 hours — what are my options?',
    'Check baggage allowance for international flights',
  ],
  hotel: [
    'Extend my stay at Grand Hyatt KL by 2 nights',
    'My hotel room is not as described in the booking',
    'Request early check-in for tomorrow morning',
  ],
  insurance: [
    'My flight was delayed 6 hours, how do I file a claim?',
    'Lost luggage — what is the reimbursement process?',
    'Trip cancellation due to a medical emergency',
  ],
  trip: [
    'Plan a 5-day trip to Tokyo, budget MYR 8,000',
    'Weekend getaway from KL to Langkawi',
    'Best itinerary for a Bali family trip, 7 days',
  ],
  car: [
    'My rental car broke down in Penang — help!',
    'Extend car rental in Singapore by 3 more days',
    'Minor accident with rental car, what should I do?',
  ],
};


const WORKFLOW_STAGES = [
  { id: 1, label: 'Input Agent', short: '1', icon: '📥', desc: 'GLM parses your message' },
  { id: 2, label: 'Validation',  short: '2', icon: '🔍', desc: 'Checks for missing info' },
  { id: 3, label: 'Reason',      short: '3', icon: '🧠', desc: 'GLM plans tool calls' },
  { id: 4, label: 'Act',         short: '4', icon: '⚙️', desc: 'APIs fetch real data' },
  { id: 5, label: 'Observe',     short: '5', icon: '📊', desc: 'GLM builds recovery plan' },
];

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ setView }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>('master');
  const [agentPanel, setAgentPanel] = useState<Record<string, AgentPanelEntry>>({ ...DEFAULT_PANEL });
  const [liveStage, setLiveStage] = useState(0);
  const panelTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chatEndRef    = useRef<HTMLDivElement>(null);
  const lastAiMsgRef  = useRef<HTMLDivElement>(null);
  let msgId = useRef(0);

  const clearPanelTimers = () => {
    panelTimers.current.forEach(clearTimeout);
    panelTimers.current = [];
  };

  const runStageSimulation = () => {
    stageTimers.current.forEach(clearTimeout);
    setLiveStage(1);
    const t1 = setTimeout(() => setLiveStage(2), 2000);
    const t2 = setTimeout(() => setLiveStage(3), 4000);
    const t3 = setTimeout(() => setLiveStage(4), 7000);
    // Stage 5 (Observe) stays pulsing until the real GLM response arrives —
    // setLiveStage(6) is only called after runZenTravelWorkflow() resolves.
    const t4 = setTimeout(() => setLiveStage(5), 10000);
    stageTimers.current = [t1, t2, t3, t4];
  };

  const clearStageTimers = () => {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
  };

  const setAgent = (key: string, patch: Partial<AgentPanelEntry>) =>
    setAgentPanel((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const runPanelSimulation = () => {
    clearPanelTimers();
    setAgentPanel({
      master: { status: 'running',  activityText: 'Analyzing disruption...' },
      flight: { status: 'pending',  activityText: 'Awaiting task' },
      hotel:  { status: 'pending',  activityText: 'Awaiting task' },
      claims: { status: 'pending',  activityText: 'Awaiting task' },
    });
    const t1 = setTimeout(() => setAgent('flight', { status: 'running', activityText: 'Searching flights...' }), 1400);
    const t2 = setTimeout(() => setAgent('hotel',  { status: 'running', activityText: 'Checking accommodations...' }), 2600);
    const t3 = setTimeout(() => setAgent('claims', { status: 'running', activityText: 'Checking compensation...' }), 3800);
    panelTimers.current = [t1, t2, t3];
  };

  const finalisePanelFromResult = (result: StructuredWorkflowOutput) => {
    clearPanelTimers();

    // Stage: paused means GLM asked for clarification — agents never ran
    if (result.stage === 'paused') {
      setAgentPanel({
        master: { status: 'running',  activityText: 'Waiting for more details…' },
        flight: { status: 'pending',  activityText: 'Awaiting task' },
        hotel:  { status: 'pending',  activityText: 'Awaiting task' },
        claims: { status: 'pending',  activityText: 'Awaiting task' },
      });
      return;
    }

    // Map real action statuses to panel entries
    const actionMap: Record<string, WorkflowAction | undefined> = {};
    result.plan?.actions.forEach((a) => { actionMap[a.agent] = a; });

    const toPanel = (
      action: WorkflowAction | undefined,
      defaultText: string,
    ): AgentPanelEntry => {
      if (!action) return { status: 'pending', activityText: 'Not required' };
      if (action.status === 'completed') return { status: 'completed', activityText: action.output?.slice(0, 55) ?? defaultText };
      if (action.status === 'failed')    return { status: 'failed',    activityText: action.error?.slice(0, 55) ?? 'Failed — will retry' };
      if (action.status === 'skipped')   return { status: 'pending',   activityText: 'Not needed for this case' };
      return { status: 'pending', activityText: defaultText };
    };

    const masterStatus: AgentPanelStatus = result.stage === 'failed' ? 'failed' : 'completed';
    const masterText = result.stage === 'failed'
      ? 'Workflow hit an error — check actions'
      : 'Workflow orchestrated successfully';

    setAgentPanel({
      master: { status: masterStatus, activityText: masterText },
      flight: toPanel(actionMap['flight'],        'Flight search done'),
      hotel:  toPanel(actionMap['hotel'],         'Accommodation checked'),
      claims: toPanel(actionMap['compensation'],  'Claim assessed'),
    });
  };

  const resetPanel = () => {
    clearPanelTimers();
    setAgentPanel({ ...DEFAULT_PANEL });
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender === 'ai' && (lastMsg.workflowOutput || lastMsg.specializedOutput)) {
      // Scroll to the TOP of the AI response card so the user sees the action cards first
      lastAiMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getPlaceholder = () => {
    if (activeAgent === 'master')
      return 'Describe any travel disruption (e.g. Flight MH123 from KL to Tokyo was cancelled)';
    return AGENT_CONFIG[activeAgent].placeholder;
  };

  const handleAgentSelect = (agent: ActiveAgent) => {
    setActiveAgent(agent);
    setMessages([]);
    resetPanel();
    clearStageTimers();
    setLiveStage(0);
  };

  const handleSend = async () => {
    const payload = inputText.trim();
    if (!payload || isProcessing) return;

    const userMsg: Message = { id: ++msgId.current, text: payload, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);
    if (activeAgent === 'master') {
      runPanelSimulation();
      runStageSimulation();
    }

    try {
      if (activeAgent === 'master') {
        const result = await runZenTravelWorkflow(payload);
        clearStageTimers();
        // Set to 6 (beyond last stage) so all completed stages show ✓ not the pulsing ring
        setLiveStage(result.stage === 'paused' ? 2 : 6);
        finalisePanelFromResult(result);
        const aiMsg: Message = {
          id: ++msgId.current,
          text: '',
          sender: 'ai',
          workflowOutput: result,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const result = await runSpecializedAgent(activeAgent, payload);
        const aiMsg: Message = {
          id: ++msgId.current,
          text: '',
          sender: 'ai',
          specializedOutput: result,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      if (activeAgent === 'master') {
        resetPanel();
        clearStageTimers();
        setLiveStage(0);
      }
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: ++msgId.current,
          text: `Something went wrong: ${errorText}. Please try again.`,
          sender: 'ai',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeMascot = activeAgent === 'master' ? mascotMain : AGENT_CONFIG[activeAgent].mascot;
  const activeLabel  = activeAgent === 'master' ? 'Brain Master' : AGENT_CONFIG[activeAgent].label + ' Agent';

  return (
    <div className="cb-page fade-in">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="cb-topbar">
        <div className="cb-brand">
          <span className="cb-brand-name">ZenTravel</span>
          <span className="cb-brand-tag">AI Control</span>
        </div>

        <div className="cb-topbar-center">
          <span className={`cb-status-pill ${isProcessing ? 'cb-status-pill--busy' : 'cb-status-pill--ready'}`}>
            <span className="cb-status-dot" />
            {isProcessing ? 'Processing…' : 'Ready'}
          </span>
        </div>

        <button className="cb-nav-back" onClick={() => setView('tripplanner')}>
          ← Trip Planner
        </button>
      </header>

      <div className="cb-content">

        {/* ── Agent selector bar ──────────────────────────────────────── */}
        <div className="cb-agent-bar">
          <div
            className={`cb-chip cb-chip--master ${activeAgent === 'master' ? 'cb-chip--active' : ''}`}
            onClick={() => handleAgentSelect('master')}
          >
            <div className="cb-chip-img-wrap">
              <img src={mascotMain} className="cb-chip-img" alt="Master AI" />
            </div>
            <span className="cb-chip-name">Brain Master</span>
          </div>

          {(Object.keys(AGENT_CONFIG) as AgentType[]).map((type) => (
            <div
              key={type}
              className={`cb-chip ${activeAgent === type ? 'cb-chip--active' : ''}`}
              onClick={() => handleAgentSelect(type)}
            >
              <div className="cb-chip-img-wrap">
                <img src={AGENT_CONFIG[type].mascot} className="cb-chip-img" alt={AGENT_CONFIG[type].label} />
              </div>
              <span className="cb-chip-name">{AGENT_CONFIG[type].label}</span>
            </div>
          ))}
        </div>

        {/* ── Current mode strip ──────────────────────────────────────── */}
        <div className="cb-mode-strip">
          <img src={activeMascot} className="cb-mode-strip-mascot" alt="" />
          <div className="cb-mode-strip-text">
            <span className="cb-mode-strip-title">{activeLabel}</span>
            <span className="cb-mode-strip-desc">
              {activeAgent === 'master'
                ? 'Orchestrates the full travel disruption recovery workflow'
                : `Dedicated specialist — focused on ${activeAgent} queries`}
            </span>
          </div>
          <span className="cb-mode-strip-badge">
            {activeAgent === 'master' ? 'ORCHESTRATOR' : 'SPECIALIST'}
          </span>
        </div>

        {/* ── Workflow Stage Progress (master only) ───────────────────── */}
        {activeAgent === 'master' && liveStage > 0 && (
          <div className="wsp-bar">
            <span className="wsp-bar-label">ReAct Workflow</span>
            <div className="wsp-steps">
              {WORKFLOW_STAGES.map((stage, idx) => {
                const isDone   = liveStage > stage.id;
                const isActive = liveStage === stage.id;
                return (
                  <React.Fragment key={stage.id}>
                    <div className={`wsp-step ${isDone ? 'wsp-step--done' : isActive ? 'wsp-step--active' : 'wsp-step--pending'}`} key={stage.id}>
                      <div className="wsp-step-circle">
                        {isDone ? '✓' : stage.short}
                        {isActive && <span className="wsp-pulse" />}
                      </div>
                      <div className="wsp-step-text">
                        <span className="wsp-step-name">{stage.label}</span>
                        {(isDone || isActive) && (
                          <span className="wsp-step-desc">{stage.desc}</span>
                        )}
                      </div>
                    </div>
                    {idx < WORKFLOW_STAGES.length - 1 && (
                      <div className={`wsp-connector ${liveStage > stage.id ? 'wsp-connector--done' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Agent Activity Panel (master only) ──────────────────────── */}
        {activeAgent === 'master' && (
          <div className="aap-panel">
            <div className="aap-panel-header">
              <span className="aap-panel-title">Agent Activity</span>
              <span className={`aap-live-badge ${isProcessing ? 'aap-live-badge--active' : ''}`}>
                {isProcessing ? '● LIVE' : '○ IDLE'}
              </span>
            </div>
            <div className="aap-agents-row">
              {PANEL_AGENTS.map(({ key, label, mascot, color }) => {
                const entry = agentPanel[key];
                return (
                  <div key={key} className={`aap-card aap-card--${entry.status}`}>
                    <div className="aap-card-avatar" style={{ borderColor: color }}>
                      <img src={mascot} alt={label} className="aap-card-mascot" />
                      {entry.status === 'running' && <span className="aap-pulse-ring" style={{ borderColor: color }} />}
                    </div>
                    <div className="aap-card-body">
                      <span className="aap-card-name">{label}</span>
                      <div className="aap-card-status-row">
                        <span className={`aap-status-dot aap-status-dot--${entry.status}`} />
                        <span className="aap-status-label">
                          {entry.status === 'running'   ? 'Running'   :
                           entry.status === 'completed' ? 'Completed' :
                           entry.status === 'failed'    ? 'Failed'    : 'Pending'}
                        </span>
                      </div>
                      <span className="aap-activity-text">{entry.activityText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Chat panel ──────────────────────────────────────────────── */}
        <div className="cb-chat-panel">

          <div className="cb-chat-panel-header">
            <span className="cb-chat-panel-label">CONVERSATION</span>
            {messages.length > 0 && (
              <button
                className="cb-clear-btn"
                onClick={() => { setMessages([]); resetPanel(); clearStageTimers(); setLiveStage(0); }}
                disabled={isProcessing}
              >
                Clear
              </button>
            )}
          </div>

          <div className="cb-chat-body">
            {messages.length === 0 ? (
              <div className="cb-empty">
                <div className="cb-empty-mascot-wrap">
                  <img src={activeMascot} className="cb-empty-mascot" alt="" />
                </div>
                <p className="cb-empty-heading">How can I help?</p>
                <p className="cb-empty-sub">
                  {activeAgent === 'master'
                    ? 'Describe any travel disruption and I will handle the full recovery workflow.'
                    : `Ask your ${activeAgent} question and I will act as your dedicated ${activeAgent} specialist.`}
                </p>
                <div className="cb-prompts">
                  {SUGGESTED_PROMPTS[activeAgent].map((prompt, i) => (
                    <button
                      key={i}
                      className="cb-prompt"
                      onClick={() => setInputText(prompt)}
                      disabled={isProcessing}
                    >
                      <span className="cb-prompt-arrow">→</span>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-container">
                {messages.map((msg, idx) => {
                  const isLastAI =
                    msg.sender === 'ai' &&
                    idx === messages.length - 1 &&
                    (!!msg.workflowOutput || !!msg.specializedOutput);
                  return (
                    <div
                      key={msg.id}
                      ref={isLastAI ? lastAiMsgRef : undefined}
                      className={`message ${msg.sender}`}
                    >
                      {msg.specializedOutput ? (
                        <AgentResponseCard output={msg.specializedOutput} />
                      ) : msg.workflowOutput ? (
                        <WorkflowResponseCard output={msg.workflowOutput} />
                      ) : (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                      )}
                    </div>
                  );
                })}
                {isProcessing && (
                  <div className="message ai">
                    <span className="typing-indicator">
                      <span /><span /><span />
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div className="cb-input-bar">
            <input
              type="text"
              className="cb-input"
              placeholder={getPlaceholder()}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              disabled={isProcessing}
            />
            <button className="cb-send" onClick={() => void handleSend()} disabled={isProcessing}>
              {isProcessing ? (
                <span className="cb-send-spinner" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
