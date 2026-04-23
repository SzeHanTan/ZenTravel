import React, { useState } from 'react';
import '../App.css';
import '../styles/ChatbotPage.css';

interface ChatbotPageProps {
  setView: (v: any) => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = () => {
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'ai' }>>([]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages([...messages, { text: inputText, sender: 'user' }]);
      setInputText('');
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: 'Hello! I\'m ZenTravel AI. How can I help you with your travel needs today?', 
          sender: 'ai' 
        }]);
      }, 1000);
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
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend}>
              Send
            </button>
          </div>

          <button className="chat-btn">
            Chat with AI
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