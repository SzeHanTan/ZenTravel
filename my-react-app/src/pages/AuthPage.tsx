import logo from '../assets/zentravel_logo.png'

interface AuthProps {
  onGoogle: () => void;
  onEmailClick: () => void;
  onRegister: (e: any) => void;
  view: string;
  setView: (v: any) => void;
  setEmail: (e: string) => void;
  setPassword: (p: string) => void;
}

export const AuthPage = ({ onGoogle, onEmailClick, onRegister, view, setView, setEmail, setPassword }: AuthProps) => {
  if (view === 'auth') {
    return (
      <div className="landing-container fade-in">
        <div className="content-wrapper">
          <div className="logo-circle small"><img src={logo} className="logo-img" alt="Logo" /></div>
          <div className="auth-button-group">
            <button className="auth-btn google-btn" onClick={onGoogle}><span className="btn-icon">G</span> Continue with Google</button>
            <button className="auth-btn email-btn" onClick={onEmailClick}>Continue with Email</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container fade-in">
      <div className="content-wrapper">
        <h2 className="register-title">Create Account</h2>
        <form className="register-form" onSubmit={onRegister}>
          <input type="email" placeholder="Email" className="auth-input" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="auth-input" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="auth-btn email-btn">Sign Up</button>
          <p className="back-link" onClick={() => setView('auth')}>← Back</p>
        </form>
      </div>
    </div>
  );
};