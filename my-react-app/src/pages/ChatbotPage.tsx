import React, { useState } from 'react';
import '../App.css';
import '../styles/ChatbotPage.css';
import { runZenTravelWorkflow } from '../agents/workflowEngine';

interface ChatbotPageProps {
  setView: (v: string) => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ setView }) => {
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'ai' }>>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    const payload = inputText.trim();
    if (!payload) return;

    setMessages((prev) => [...prev, { text: payload, sender: 'user' }]);
    setInputText('');
    setIsProcessing(true);

    try {
      const result = await runZenTravelWorkflow(payload);
      const actionLines = result.plan?.actions.map(
        (action) =>
          `- ${action.agent.toUpperCase()}: ${action.status}${action.output ? ` (${action.output})` : ''}${
            action.error ? ` [${action.error}]` : ''
          }`,
      );

      const details = [
        `Stage: ${result.stage}`,
        `Disruption: ${result.incident.disruptionType}`,
        `Summary: ${result.incident.summary}`,
        `Reasoning: ${result.reasoning.join(' ')}`,
        result.clarifyingQuestions.length > 0
          ? `Need clarification: ${result.clarifyingQuestions.join(' ')}`
          : 'No additional clarification required.',
        actionLines && actionLines.length > 0 ? `Actions:\n${actionLines.join('\n')}` : 'No actions executed yet.',
        `Outcome: ${result.finalMessage}`,
      ];

      setMessages((prev) => [
        ...prev,
        {
          text: details.join('\n\n'),
          sender: 'ai',
        },
      ]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown failure';
      setMessages((prev) => [
        ...prev,
        {
          text: `Workflow engine error: ${errorText}. Please try again with more context (flight number, route, and disruption type).`,
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
        <div className="category-grid">
          <div className="cat-btn red">HOTELS</div>
          <div className="cat-btn orange">FLIGHTS</div>
          <div className="cat-btn yellow">INSURANCE</div>
          <div className="cat-btn green">TRIP</div>
          <div className="cat-btn blue">CAR</div>
        </div>

        <div className="chat-modal">
          <h2 className="modal-title">ZenTravel AI</h2>
          
          <div className="chat-area">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>Start a conversation with ZenTravel AI</p>
              </div>
            ) : (
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <input
              type="text" 
              className="chat-input"
              placeholder="Describe disruption (e.g. Flight MH123 from KL to Tokyo was cancelled)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              disabled={isProcessing}
            />
            <button className="send-btn" onClick={() => void handleSend()} disabled={isProcessing}>
              {isProcessing ? 'Running...' : 'Send'}
            </button>
          </div>

          <button className="chat-btn" onClick={() => setView('tripplanner')}>
            Back to Trip Planner
          </button>
        </div>

        <div className="floating-buttons">
          <button className="float-btn chatbot-btn">chatbot</button>
          <button className="float-btn ai-btn">AI</button>
        </div>
      </main>
    </div>
  );
};