import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { MessageCircle } from 'lucide-react';

// Services
import { loginWithGoogle } from './services/authService';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatbotPage } from './pages/ChatbotPage';
import { BookingPage } from './pages/BookingPage'; 
import { NotificationPage } from './pages/NotificationPage';
import { ViewTicket } from './pages/ViewTicket';
import { RefundPage } from './pages/RefundPage'; 
import { AboutUs } from './pages/AboutUs';
import { HelpCenter } from './pages/HelpCenter';
import { EditProfile } from './pages/EditProfile';
import { SavedPage } from './pages/SavedPage'; 
import { MyReviews } from './pages/MyReviews';

// Category Pages
import { HotelsPage } from './pages/HotelsPage';
import { FlightsPage } from './pages/FlightsPage';
import { InsurancePage } from './pages/InsurancePage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { CarRentalPage } from './pages/CarRentalPage';
import { ManualPlannerPage } from './pages/ManualPlannerPage';

// Components
import { BottomNav } from './components/BottomNav';

import './App.css';

type ViewState = 
  | 'landing' | 'auth' | 'register' | 'home' | 'profile' 
  | 'chatbot' | 'booking' | 'notification' | 'view-ticket' 
  | 'refund' | 'about' | 'help' 
  | 'edit-profile' | 'saved' | 'my-reviews'
  | 'hotels' | 'flights' | 'insurance' 
  | 'tripplanner' | 'carrental'| 'manual-planner';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(''); 
  const [user, setUser] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [loading, setLoading] = useState(true); 

  const [globalCurrency, setGlobalCurrency] = useState({ name: 'Malaysian Ringgit', code: 'RM | MYR' });
  const [cashbackBalance, setCashbackBalance] = useState(0.00);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoaded(true);
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'landing' && !loading) {
      const timer = setTimeout(() => {
        if (authLoaded) {
          if (user) setView('home'); 
          else setView('auth'); 
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, user, authLoaded, loading]);

  // FIX: Change 'any' to specific types and make the second parameter truly optional
  // This allows teammate's components to call it with just one string
  const handleSetView = (newView: ViewState | string, id: string = '') => {
    setView(newView as ViewState);
    if (id) {
        setSelectedTicketId(id);
    }
  };

  async function handleGoogle() {
    try { 
      await loginWithGoogle(); 
      setView('home'); 
    } catch (e) { 
      console.error(e); 
    }
  }

  const authenticatedViews: ViewState[] = [
    'home', 'profile', 'chatbot', 'booking', 'notification', 
    'view-ticket', 'refund', 'about', 'help', 
    'edit-profile', 'saved', 'my-reviews',
    'hotels', 'flights', 'insurance', 'tripplanner', 'carrental', 'manual-planner'
  ];
  const showNavBar = authenticatedViews.includes(view);

  const renderContent = () => {
    switch (view) {
      case 'home': return <HomePage setView={handleSetView} globalCurrency={globalCurrency} />;
      case 'profile': return (
        <ProfilePage 
          setView={handleSetView} 
          globalCurrency={globalCurrency} 
          setGlobalCurrency={setGlobalCurrency} 
          cashbackBalance={cashbackBalance}
          setCashbackBalance={setCashbackBalance}
        />
      );
      
      // These will now accept handleSetView because we fixed the parameter types
      case 'hotels': return <HotelsPage setView={handleSetView} />;
      case 'flights': return <FlightsPage setView={handleSetView} />;
      case 'insurance': return <InsurancePage setView={handleSetView} />;
      case 'tripplanner': return <TripPlannerPage setView={handleSetView} />;
      case 'manual-planner': return <ManualPlannerPage setView={handleSetView} />;
      case 'carrental': return <CarRentalPage setView={handleSetView} />;
      
      case 'chatbot': return <ChatbotPage setView={handleSetView} />;
      case 'booking': return <BookingPage setView={handleSetView} />;
      case 'notification': return <NotificationPage setView={handleSetView} />;
      case 'view-ticket': return <ViewTicket ticketId={selectedTicketId} setView={handleSetView} />;
      case 'refund': return <RefundPage bookingId={selectedTicketId} setView={handleSetView} />;
      case 'about': return <AboutUs setView={handleSetView} />;
      case 'help': return <HelpCenter setView={handleSetView} />;
      case 'edit-profile': return <EditProfile setView={handleSetView} />;
      case 'saved': return <SavedPage setView={handleSetView} />;
      case 'my-reviews': return <MyReviews setView={handleSetView} />;
      
      default: return null;
    }
  };

  return (
    <div className="app-container">
      {view === 'landing' && <LandingPage />}
      
      {(view === 'auth' || view === 'register') && (
        <AuthPage 
          view={view} setView={setView} onGoogle={handleGoogle} 
          onEmailClick={() => setView('register')}
          onRegister={async () => {}} setEmail={() => {}} setPassword={() => {}}
        />
      )}

      {showNavBar && (
        <>
          <main className="main-content-area">
            {renderContent()}
          </main>
          <div className="persistent-chatbot-btn" onClick={() => setView('chatbot')}>
            <MessageCircle color="#7b2cbf" />
          </div>
          <BottomNav currentView={view} setView={handleSetView} />
        </>
      )}
    </div>
  );
}

export default App;