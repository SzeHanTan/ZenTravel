import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import '../styles/ChatbotPage.css';
import '../styles/AgentResponseCard.css';
import { runZenTravelWorkflow } from '../agents/workflowEngine';
import { runSpecializedAgent } from '../agents/specializedAgents';
import type { AgentType, SpecializedAgentOutput } from '../agents/specializedAgents';
import type { StructuredWorkflowOutput } from '../agents/types';
import { AgentResponseCard } from '../components/AgentResponseCard';
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

function formatWorkflowOutput(output: StructuredWorkflowOutput): string {
  const actionLines = output.plan?.actions.map(
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

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ setView }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>('master');
  const chatEndRef = useRef<HTMLDivElement>(null);
  let msgId = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPlaceholder = () => {
    if (activeAgent === 'master')
      return 'Describe any travel disruption (e.g. Flight MH123 from KL to Tokyo was cancelled)';
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
        const aiMsg: Message = {
          id: ++msgId.current,
          text: formatWorkflowOutput(result),
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

  return (
    <div className="chatbot-page fade-in">
      <header className="chatbot-header">ZenTravel</header>

      <main className="chatbot-content">
        {/* Agent selector */}
        <div className="category-grid">
          <div
            className={`cat-btn master-btn ${activeAgent === 'master' ? 'active-agent' : ''}`}
            onClick={() => handleAgentSelect('master')}
          >
            <img src={mascotMain} alt="AI" className="cat-btn-mascot" />
            <span className="cat-btn-label">AI</span>
          </div>
          {(Object.keys(AGENT_CONFIG) as AgentType[]).map((type) => (
            <div
              key={type}
              className={`cat-btn ${activeAgent === type ? 'active-agent' : ''}`}
              style={{ backgroundColor: AGENT_CONFIG[type].color }}
              onClick={() => handleAgentSelect(type)}
            >
              <img src={AGENT_CONFIG[type].mascot} alt={AGENT_CONFIG[type].label} className="cat-btn-mascot" />
              <span className="cat-btn-label">{AGENT_CONFIG[type].label}</span>
            </div>
          ))}
        </div>

        {/* Active agent label */}
        <div className="active-agent-label">
          {activeAgent === 'master'
            ? '✦ Brain Master — handles all travel disruptions'
            : `✦ ${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Specialist — focused expert mode`}
        </div>

        <div className="chat-modal">
          <h2 className="modal-title">ZenTravel AI</h2>

          <div className="chat-area">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>
                  {activeAgent === 'master'
                    ? 'Describe any travel disruption and I will handle the full recovery workflow.'
                    : `Ask your ${activeAgent} question and I will act as your dedicated ${activeAgent} specialist.`}
                </p>
              </div>
            ) : (
              <div className="messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    {msg.specializedOutput ? (
                      <AgentResponseCard output={msg.specializedOutput} />
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                    )}
                  </div>
                ))}
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

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder={getPlaceholder()}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              disabled={isProcessing}
            />
            <button className="send-btn" onClick={() => void handleSend()} disabled={isProcessing}>
              {isProcessing ? '...' : 'Send'}
            </button>
          </div>

          <button className="chat-btn" onClick={() => setView('tripplanner')}>
            Back to Trip Planner
          </button>
        </div>
      </main>
    </div>
  );
};
