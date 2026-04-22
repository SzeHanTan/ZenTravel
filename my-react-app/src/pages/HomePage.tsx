import { Home, Bell, Calendar, User, Search } from 'lucide-react';
import '../styles/HomePage.css';

interface HomeProps {
  setView: (v: 'landing' | 'auth' | 'register' | 'home' | 'profile') => void;
}

export const HomePage = ({ setView }: HomeProps) => {
  return (
    <div className="home-page fade-in">
      <header className="home-header">ZenTravel</header>
      <main className="home-content pb-100">
        <div className="category-grid">
          <div className="cat-box red">Hotels</div>
          <div className="cat-box orange">Flights</div>
          <div className="cat-box yellow">Trains</div>
          <div className="cat-box green">Cars</div>
          <div className="cat-box blue">Attractions</div>
        </div>
        <div className="search-bar">
          <Search size={18} color="#b066e3" />
          <input type="text" placeholder="Search destinations..." />
        </div>
        <div className="ai-recommendation">
          <h3>AI Recommendation</h3>
          <p>Plan your next trip with our AI-powered itinerary generator!</p>
        </div>
      </main>
      <nav className="bottom-nav">
        <Home className="nav-icon active" onClick={() => setView('home')} />
        <Bell className="nav-icon" />
        <div className="ai-floating-btn">AI</div>
        <Calendar className="nav-icon" />
        <User className="nav-icon" onClick={() => setView('profile')} /> 
      </nav>
    </div>
  );
};