import { useState, useEffect } from 'react'
import { auth, db } from './services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { registerUser, loginWithGoogle } from './services/authService'

function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'register' | 'home'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
    } catch (error: any) { alert(error.message); }
  };

  return (
    <div className="app-container">
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

      {view === 'home' && <HomePage />}
    </div>
  )
}

export default App