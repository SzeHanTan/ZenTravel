import { useState, useEffect } from 'react'
import { auth } from './services/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// 保留队友的 import (authService)
import { registerUser, loginWithGoogle } from './services/authService'

// 引入所有页面，包括你新增的 ProfilePage
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  // 视图状态：保留了 profile
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

  // Landing 页自动跳转逻辑
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

  // 保留队友的注册逻辑 (使用 registerUser)
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

  // 保留队友的 Google 登录逻辑 (使用 loginWithGoogle)
  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      setView('home');
    } catch (error: any) { 
      alert(error.message); 
    }
  };

  return (
    <div className="app-container">
      {/* 1. 启动页 */}
      {view === 'landing' && <LandingPage />}
      
      {/* 2. 登录/注册页 */}
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

      {/* 3. 首页 */}
      {view === 'home' && <HomePage setView={setView} />}
      
      {/* 4. 你的 Profile 页面 (新增) */}
      {view === 'profile' && <ProfilePage setView={setView} />}
    </div>
  )
}

export default App;
