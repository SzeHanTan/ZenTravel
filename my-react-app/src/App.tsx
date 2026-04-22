import { useState, useEffect } from 'react'
import './App.css'
import { auth, db } from './services/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

// Import our new pages
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'

function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'register' | 'home'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (view === 'landing') {
      const timer = setTimeout(() => setView('auth'), 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: new Date(),
      });
      setView('home');
    } catch (error: any) { alert(error.message); }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
      }, { merge: true });
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
          onGoogle={handleGoogleSignIn}
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