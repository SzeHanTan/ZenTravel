import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

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

// Components
import { BottomNav } from './components/BottomNav';

// Global Styles
import './App.css';
import { MessageCircle } from 'lucide-react';

type ViewState = 
  | 'landing' | 'auth' | 'register' | 'home' | 'profile' 
  | 'chatbot' | 'booking' | 'notification' | 'view-ticket' 
  | 'refund' | 'about' | 'help' 
  | 'edit-profile' | 'saved' | 'my-reviews';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(''); 
  const [user, setUser] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // 【全局状态 1: 货币】
  const [globalCurrency, setGlobalCurrency] = useState({ name: 'Malaysian Ringgit', code: 'RM | MYR' });
  
  // 【全局状态 2: 返现余额】
  const [cashbackBalance, setCashbackBalance] = useState(0.00);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'landing') {
      const timer = setTimeout(() => {
        if (authLoaded) {
          if (user) setView('home'); 
          else setView('auth'); 
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, user, authLoaded]);

  const handleSetView = (newView: any, id?: string) => {
    setView(newView);
    if (id) setSelectedTicketId(id);
  };

  const authenticatedViews: ViewState[] = [
    'home', 'profile', 'chatbot', 'booking', 'notification', 
    'view-ticket', 'refund', 'about', 'help', 
    'edit-profile', 'saved', 'my-reviews'
  ];
  const showNavBar = authenticatedViews.includes(view);

  async function handleGoogle() {
    try { 
      await loginWithGoogle(); 
      setView('home'); 
    } catch (e) { 
      console.error(e); 
    }
  }

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

      <main className="main-content-area">
        {view === 'home' && <HomePage setView={handleSetView} globalCurrency={globalCurrency} />}
        
        {/* ProfilePage 接收所有全局状态进行联动 */}
        {view === 'profile' && (
          <ProfilePage 
            setView={handleSetView} 
            globalCurrency={globalCurrency} 
            setGlobalCurrency={setGlobalCurrency} 
            cashbackBalance={cashbackBalance}
            setCashbackBalance={setCashbackBalance}
          />
        )}

        {view === 'chatbot' && <ChatbotPage setView={handleSetView} />}
        {view === 'booking' && <BookingPage setView={handleSetView} />} 
        {view === 'notification' && <NotificationPage setView={handleSetView} />}
        {view === 'view-ticket' && <ViewTicket ticketId={selectedTicketId} setView={handleSetView} />}
        {view === 'refund' && <RefundPage bookingId={selectedTicketId} setView={handleSetView} />}
        {view === 'about' && <AboutUs setView={handleSetView} />}
        {view === 'help' && <HelpCenter setView={handleSetView} />}
        {view === 'edit-profile' && <EditProfile setView={handleSetView} />}
        {view === 'saved' && <SavedPage setView={handleSetView} />}
        {view === 'my-reviews' && <MyReviews setView={handleSetView} />}
      </main>

      {showNavBar && (
        <>
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