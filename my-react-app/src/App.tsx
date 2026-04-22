import { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

// Components
import { BottomNav } from './components/BottomNav';

// Global Styles
import './App.css';
import { MessageCircle } from 'lucide-react';

// Define the available views for TypeScript
type ViewState = 'landing' | 'auth' | 'register' | 'home' | 'profile' | 'chatbot' | 'booking' | 'notification';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // 1. Session Persistence: Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Landing Timer: Transitions to Home (if logged in) or Auth (if guest)
  useEffect(() => {
    if (view === 'landing') {
      const timer = setTimeout(() => {
        if (user) {
          setView('home'); 
        } else {
          setView('auth'); 
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, user]);

  // 3. Auth Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(email, password);
      setView('home'); 
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        alert("This account already exists! Please log in instead.");
      } else {
        alert(error.message);
      }
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

  // 4. Helper: Should we show the Bottom Navigation bar?
  const authenticatedViews: ViewState[] = ['home', 'profile', 'chatbot', 'booking', 'notification'];
  const showNavBar = authenticatedViews.includes(view);

  return (
    <div className="app-container">
      
      {/* Landing & Authentication Views */}
      {view === 'landing' && <LandingPage />}
      
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
      <main className="main-content-area">
        {view === 'home' && <HomePage setView={setView} />}
        {view === 'profile' && <ProfilePage setView={setView} />}
        {view === 'chatbot' && <ChatbotPage setView={setView} />}
        {view === 'booking' && <BookingPage setView={setView} />}
        {view === 'notification' && <NotificationPage setView={setView} />}
      </main>

      {/* Persistent Global Navigation */}
      {showNavBar && (
        <>
          {/* The actual floating bubble */}
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