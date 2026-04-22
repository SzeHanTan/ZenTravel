import { useState, useEffect } from 'react'
import './App.css'
import { auth, db } from './services/firebase'
import { onAuthStateChanged, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  // 扩展视图状态，增加 'profile'
  const [view, setView] = useState<'landing' | 'auth' | 'register' | 'home' | 'profile'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // 监听 Firebase 登录状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

      {/* 这里的 setView 传给页面，用于点击底部导航切换 */}
      {view === 'home' && <HomePage setView={setView} />}
      
      {view === 'profile' && <ProfilePage setView={setView} />}
    </div>
  )
}

export default App