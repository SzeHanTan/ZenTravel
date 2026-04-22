import logo from '../assets/zentravel_logo.png'

interface AuthProps {
  onGoogle: () => void;
  onEmailClick: () => void;
  onRegister: (e: any) => void;
  view: 'landing' | 'auth' | 'register' | 'home' | 'profile';
  setView: (v: any) => void;
  setEmail: (e: string) => void;
  setPassword: (p: string) => void;
}

export const AuthPage = ({ onGoogle, onEmailClick, onRegister, view, setView, setEmail, setPassword }: AuthProps) => {
  return (
    <div className="landing-container fade-in">
      <div className="content-wrapper">
        {/* Logo 部分：保留了你原来的圆圈结构 */}
        <div className="logo-circle small" style={{ width: '140px', height: '140px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', overflow: 'hidden' }}>
          <img src={logo} style={{ width: '80%' }} alt="Logo" />
        </div>
        
        {view === 'auth' ? (
          <div className="auth-button-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
            {/* 保留你原来的按钮 ClassName，确保 CSS 依然生效 */}
            <button className="auth-btn google-btn" onClick={onGoogle} style={{ padding: '14px', borderRadius: '50px', cursor: 'pointer' }}>
              <span className="btn-icon">G</span> Continue with Google
            </button>
            <button className="auth-btn email-btn" onClick={onEmailClick} style={{ padding: '14px', borderRadius: '50px', cursor: 'pointer', backgroundColor: '#333', color: 'white' }}>
              Continue with Email
            </button>
          </div>
        ) : (
          <div style={{ width: '300px' }}>
            <h2 className="register-title" style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Create Account</h2>
            <form className="register-form" onSubmit={onRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="email" 
                placeholder="Email" 
                className="auth-input" 
                style={{ padding: '12px', borderRadius: '8px' }}
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="auth-input" 
                style={{ padding: '12px', borderRadius: '8px' }}
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="auth-btn email-btn" style={{ padding: '14px', borderRadius: '50px', backgroundColor: '#333', color: 'white', cursor: 'pointer', marginTop: '10px' }}>
                Sign Up
              </button>
              <p className="back-link" onClick={() => setView('auth')} style={{ color: 'white', textAlign: 'center', cursor: 'pointer', marginTop: '15px', textDecoration: 'underline' }}>
                ← Back
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}