import { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MessageCircle } from 'lucide-react';

// Services
import { registerUser, loginWithGoogle } from './services/authService';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatbotPage } from './pages/ChatbotPage';
import { BookingPage } from './pages/BookingPage';
import { NotificationPage } from './pages/NotificationPage';

// Category Pages
import { HotelsPage } from './pages/HotelsPage';
import { FlightsPage } from './pages/FlightsPage';
import { InsurancePage } from './pages/InsurancePage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { CarRentalPage } from './pages/CarRentalPage';
import { ManualPlannerPage } from './pages/ManualPlannerPage';

// Components
import { BottomNav } from './components/BottomNav';

// Global Styles
import './App.css';

type ViewState = 
  | 'landing' | 'auth' | 'register' 
  | 'home' | 'profile' | 'chatbot' 
  | 'booking' | 'notification'
  | 'hotels' | 'flights' | 'insurance' 
  | 'tripplanner' | 'carrental'| 'manual-planner';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // BUG FIX: Added loading state

  // 1. Session Persistence: Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Firebase is done checking auth status
    });
    return () => unsubscribe();
  }, []);

  // 2. Landing Timer: Transitions only after Firebase is ready
  useEffect(() => {
    if (view === 'landing' && !loading) { // Wait for loading to be false
      const timer = setTimeout(() => {
        if (user) {
          setView('home'); 
        } else {
          setView('auth'); 
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, user, loading]);

  // 3. Auth Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(email, password);
      setView('home'); 
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      setView('home');
    } catch (error: any) { 
      alert(error.message); 
    }
  };

  // 4. Navigation Rules
  const authenticatedViews: ViewState[] = [
    'home', 'profile', 'chatbot', 'booking', 'notification',
    'hotels', 'flights', 'insurance', 'tripplanner', 'carrental'
  ];
  const showNavBar = authenticatedViews.includes(view);

  // 5. View Switcher Logic
  const renderView = () => {
    switch (view) {
      case 'home': return <HomePage setView={setView} />;
      case 'profile': return <ProfilePage setView={setView} />;
      case 'chatbot': return <ChatbotPage setView={setView} />;
      case 'booking': return <BookingPage setView={setView} />;
      case 'notification': return <NotificationPage setView={setView} />;
      case 'hotels': return <HotelsPage setView={setView} />;
      case 'flights': return <FlightsPage setView={setView} />;
      case 'insurance': return <InsurancePage setView={setView} />;
      case 'tripplanner': return <TripPlannerPage setView={setView} />;
      case 'manual-planner': return <ManualPlannerPage setView={setView} />;
      case 'carrental': return <CarRentalPage setView={setView} />;
      default: return <HomePage setView={setView} />;
    }
  };

  return (
    <div className="app-container">
      
      {/* Landing View */}
      {view === 'landing' && <LandingPage />}
      
      {/* Authentication Views */}
      {(view === 'auth' || view === 'register') && (
        <AuthPage 
          view={view}
          setView={setView}
          onGoogle={handleGoogle}
          onEmailClick={() => setView('register')}
          onRegister={handleRegister} 
          setEmail={setEmail}
          setPassword={setPassword}
        />
      )}

      {/* Main App Content Area */}
      {showNavBar && (
        <main className="main-content-area">
          {renderView()}
        </main>
      )}

      {/* Persistent Global Navigation */}
      {showNavBar && (
        <>
          <div className="persistent-chatbot-btn" onClick={() => setView('chatbot')}>
            <MessageCircle color="#7b2cbf" />
          </div>
          <BottomNav currentView={view} setView={setView} />
        </>
      )}
    </div>
  );
}

export default App;