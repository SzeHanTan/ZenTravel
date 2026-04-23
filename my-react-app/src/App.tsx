import { lazy, Suspense, useState, useEffect } from 'react';
import { auth } from './services/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import mascotImg from './assets/MASCOT-removebg-preview.png';
import { FloatingChatWidget } from './components/FloatingChatWidget';

// Services
import { loginWithGoogle } from './services/authService';

// Pages (lazy-loaded to reduce initial bundle size)
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage').then((m) => ({ default: m.ChatbotPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })));
const NotificationPage = lazy(() => import('./pages/NotificationPage').then((m) => ({ default: m.NotificationPage })));
const ViewTicket = lazy(() => import('./pages/ViewTicket').then((m) => ({ default: m.ViewTicket })));
const RefundPage = lazy(() => import('./pages/RefundPage').then((m) => ({ default: m.RefundPage })));
const AboutUs = lazy(() => import('./pages/AboutUs').then((m) => ({ default: m.AboutUs })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then((m) => ({ default: m.HelpCenter })));
const EditProfile = lazy(() => import('./pages/EditProfile').then((m) => ({ default: m.EditProfile })));
const SavedPage = lazy(() => import('./pages/SavedPage').then((m) => ({ default: m.SavedPage })));
const MyReviews = lazy(() => import('./pages/MyReviews').then((m) => ({ default: m.MyReviews })));

// Category pages
const HotelsPage = lazy(() => import('./pages/HotelsPage').then((m) => ({ default: m.HotelsPage })));
const FlightsPage = lazy(() => import('./pages/FlightsPage').then((m) => ({ default: m.FlightsPage })));
const InsurancePage = lazy(() => import('./pages/InsurancePage').then((m) => ({ default: m.InsurancePage })));
const TripPlannerPage = lazy(() => import('./pages/TripPlannerPage').then((m) => ({ default: m.TripPlannerPage })));
const CarRentalPage = lazy(() => import('./pages/CarRentalPage').then((m) => ({ default: m.CarRentalPage })));
const ManualPlannerPage = lazy(() => import('./pages/ManualPlannerPage').then((m) => ({ default: m.ManualPlannerPage })));

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
  const [showFloatingChat, setShowFloatingChat] = useState(false);

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
  const pageLoader = <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;

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
      {view === 'landing' && (
        <Suspense fallback={pageLoader}>
          <LandingPage />
        </Suspense>
      )}
      
      {(view === 'auth' || view === 'register') && (
        <Suspense fallback={pageLoader}>
          <AuthPage 
            view={view} setView={setView} onGoogle={handleGoogle} 
            onEmailClick={() => setView('register')}
            onRegister={async () => {}} setEmail={() => {}} setPassword={() => {}}
          />
        </Suspense>
      )}

      {showNavBar && (
        <>
          <main className="main-content-area">
            <Suspense fallback={pageLoader}>
              {renderContent()}
            </Suspense>
          </main>
          <div
            className={`persistent-chatbot-btn ${showFloatingChat ? 'persistent-chatbot-btn--active' : ''}`}
            onClick={() => setShowFloatingChat((v) => !v)}
          >
            <img src={mascotImg} alt="AI Assistant" className="persistent-chatbot-mascot" />
          </div>
          {showFloatingChat && (
            <FloatingChatWidget
              onClose={() => setShowFloatingChat(false)}
              onOpenFull={() => { setShowFloatingChat(false); setView('chatbot'); }}
            />
          )}
          <BottomNav currentView={view} setView={handleSetView} />
        </>
      )}
    </div>
  );
}

export default App;