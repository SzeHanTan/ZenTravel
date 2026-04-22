import { Home, Bell, Calendar, User, Search, MessageCircle } from 'lucide-react';

export const HomePage = () => {
  // Use the same IMAGES constant here...
  return (
    <div className="home-page fade-in">
      <header className="home-header">ZenTravel</header>
      <main className="home-content">
        {/* ... all your category grid, AI recommendation, and horizontal sections ... */}
      </main>
      
      <nav className="bottom-nav">
        <Home className="nav-icon active" />
        <Bell className="nav-icon" />
        <div className="ai-floating-btn">AI</div>
        <Calendar className="nav-icon" />
        <User className="nav-icon" />
      </nav>
    </div>
  );
};