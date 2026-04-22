import { Home, Bell, Calendar, User, MessageCircle } from 'lucide-react';
import '../App.css';

interface NavProps {
  currentView: string;
  setView: (view: any) => void;
}

export const BottomNav = ({ currentView, setView }: NavProps) => {
  return (
    <nav className="bottom-nav">
      <div className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
        <Home className="nav-icon" />
      </div>

      <div className={`nav-item ${currentView === 'notification' ? 'active' : ''}`} onClick={() => setView('notification')}>
        <Bell className="nav-icon" />
      </div>

      <div className="ai-floating-container" onClick={() => setView('chatbot')}>
        <div className={`ai-floating-btn ${currentView === 'chatbot' ? 'active-ai' : ''}`}>AI</div>
      </div>

      <div className={`nav-item ${currentView === 'booking' ? 'active' : ''}`} onClick={() => setView('booking')}>
        <Calendar className="nav-icon" />
      </div>

      <div className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
        <User className="nav-icon" />
      </div>
    </nav>
  );
};