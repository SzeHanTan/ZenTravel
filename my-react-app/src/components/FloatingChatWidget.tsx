import React, { useState, useRef, useEffect } from 'react';
import { runZenTravelWorkflow } from '../agents/workflowEngine';
import { runSpecializedAgent } from '../agents/specializedAgents';
import type { AgentType, SpecializedAgentOutput } from '../agents/specializedAgents';
import type { StructuredWorkflowOutput } from '../agents/types';
import { AgentResponseCard } from './AgentResponseCard';
import '../styles/AgentResponseCard.css';
import '../styles/FloatingChatWidget.css';

import mascotMain from '../assets/MASCOT-removebg-preview.png';
import mascotHotel from '../assets/MASCOT1.png';
import mascotCar from '../assets/MASCOT2.png';
import mascotInsurance from '../assets/MASCOT3.png';
import mascotTrip from '../assets/MASCOT4.png';
import mascotFlight from '../assets/MASCOT5.png';

interface FloatingChatWidgetProps {
  onClose: () => void;
  onOpenFull: () => void;
}

type ActiveAgent = 'master' | AgentType;

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  specializedOutput?: SpecializedAgentOutput;
  workflowOutput?: StructuredWorkflowOutput;
}

const AGENT_CONFIG: Record<AgentType, { label: string; color: string; placeholder: string; mascot: string }> = {
  flight: {
    label: 'FLIGHTS',
    color: '#9d8977',
    placeholder: 'e.g. My flight was cancelled, need rebooking',
    mascot: mascotFlight,
  },
  hotel: {
    label: 'HOTELS',
    color: '#a8948f',
    placeholder: 'e.g. I need to extend my stay by 2 nights',
    mascot: mascotHotel,
  },
  insurance: {
    label: 'INSURANCE',
    color: '#b3a682',
    placeholder: 'e.g. My flight was delayed, how do I file a claim?',
    mascot: mascotInsurance,
  },
  trip: {
    label: 'TRIP',
    color: '#8d9d8f',
    placeholder: 'e.g. Plan a 5-day trip to Tokyo, budget MYR 8000',
    mascot: mascotTrip,
  },
  car: {
    label: 'CAR',
    color: '#7d8fa8',
    placeholder: 'e.g. My rental car broke down, what do I do?',
    mascot: mascotCar,
  },
};

function formatWorkflowOutput(output: StructuredWorkflowOutput): string {
  const actionLines =
    output.plan?.actions.map(
      (a) =>
        `• ${a.agent.toUpperCase()}: ${a.status}${a.output ? ` — ${a.output}` : ''}${a.error ? ` [${a.error}]` : ''}`,
    ) ?? [];

  const parts = [
    `Stage: ${output.stage}`,
    `Disruption: ${output.incident.disruptionType}`,
    `Reasoning: ${output.reasoning.join(' ')}`,
    output.clarifyingQuestions.length > 0
      ? `Clarification needed:\n${output.clarifyingQuestions.map((q) => `• ${q}`).join('\n')}`
      : null,
    actionLines.length > 0 ? `Actions:\n${actionLines.join('\n')}` : null,
    `Outcome: ${output.finalMessage}`,
  ];

  return parts.filter(Boolean).join('\n\n');
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ onClose, onOpenFull }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>('master');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPlaceholder = () => {
    if (activeAgent === 'master') return 'Describe any travel disruption…';
    return AGENT_CONFIG[activeAgent].placeholder;
  };

  const handleAgentSelect = (agent: ActiveAgent) => {
    setActiveAgent(agent);
    setMessages([]);
  };

  const handleSend = async () => {
    const payload = inputText.trim();
    if (!payload || isProcessing) return;

    const userMsg: Message = { id: ++msgId.current, text: payload, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      if (activeAgent === 'master') {
        const result = await runZenTravelWorkflow(payload);
        setMessages((prev) => [
          ...prev,
          {
            id: ++msgId.current,
            text: formatWorkflowOutput(result),
            sender: 'ai',
            workflowOutput: result,
          },
        ]);
      } else {
        const result = await runSpecializedAgent(activeAgent, payload);
        setMessages((prev) => [
          ...prev,
          { id: ++msgId.current, text: '', sender: 'ai', specializedOutput: result },
        ]);
      }
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { id: ++msgId.current, text: `Something went wrong: ${errorText}. Please try again.`, sender: 'ai' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeColor =
    activeAgent === 'master' ? '#7b2cbf' : AGENT_CONFIG[activeAgent].color;

  return (
    <div className="fcw-backdrop" onClick={onClose}>
      <div className="fcw-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="fcw-header" style={{ background: activeColor }}>
          <div className="fcw-header-left">
            <img src={activeAgent === 'master' ? mascotMain : AGENT_CONFIG[activeAgent].mascot} alt="mascot" className="fcw-header-mascot" />
            <div className="fcw-header-text">
              <span className="fcw-title">ZenTravel AI</span>
              <span className="fcw-subtitle">
                {activeAgent === 'master'
                  ? 'Brain Master'
                  : `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Specialist`}
              </span>
            </div>
          </div>
          <div className="fcw-header-actions">
            <button className="fcw-expand-btn" onClick={onOpenFull} title="Open full chat">
              ⤢
            </button>
            <button className="fcw-close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Agent selector tabs */}
        <div className="fcw-agent-tabs">
          <button
            className={`fcw-tab fcw-tab-master ${activeAgent === 'master' ? 'fcw-tab-active' : ''}`}
            onClick={() => handleAgentSelect('master')}
          >
            <img src={mascotMain} alt="AI" className="fcw-tab-mascot" />
            <span>AI</span>
          </button>
          {(Object.keys(AGENT_CONFIG) as AgentType[]).map((type) => (
            <button
              key={type}
              className={`fcw-tab ${activeAgent === type ? 'fcw-tab-active' : ''}`}
              style={activeAgent === type ? { borderBottomColor: AGENT_CONFIG[type].color } : {}}
              onClick={() => handleAgentSelect(type)}
            >
              <img src={AGENT_CONFIG[type].mascot} alt={AGENT_CONFIG[type].label} className="fcw-tab-mascot" />
              <span>{AGENT_CONFIG[type].label}</span>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="fcw-messages">
          {messages.length === 0 ? (
            <div className="fcw-empty">
              <img
                src={activeAgent === 'master' ? mascotMain : AGENT_CONFIG[activeAgent].mascot}
                alt="mascot"
                className="fcw-empty-mascot"
              />
              <p>
                {activeAgent === 'master'
                  ? 'Describe any travel disruption and I will handle the full recovery.'
                  : `Ask your ${activeAgent} question and I'll act as your dedicated specialist.`}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`fcw-msg fcw-msg-${msg.sender}`}>
                  {msg.specializedOutput ? (
                    <AgentResponseCard output={msg.specializedOutput} />
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="fcw-msg fcw-msg-ai">
                  <span className="fcw-typing">
                    <span /><span /><span />
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input row */}
        <div className="fcw-input-row">
          <input
            className="fcw-input"
            type="text"
            placeholder={getPlaceholder()}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            disabled={isProcessing}
          />
          <button
            className="fcw-send-btn"
            style={{ background: activeColor }}
            onClick={() => void handleSend()}
            disabled={isProcessing}
          >
            {isProcessing ? '…' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};
