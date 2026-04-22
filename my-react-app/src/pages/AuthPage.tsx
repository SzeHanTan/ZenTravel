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
    <div className="auth-bg-gradient fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* Logo 圆圈 */}
        <div style={{ 
          width: '200px', height: '200px', backgroundColor: 'white', borderRadius: '50%', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '50px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)', overflow: 'hidden' 
        }}>
          <img src={logo} alt="Logo" style={{ width: '80%' }} />
        </div>

        {view === 'auth' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px' }}>
            <button onClick={onGoogle} style={{
              padding: '16px', borderRadius: '50px', border: 'none', backgroundColor: 'white',
              fontSize: '1.1rem', cursor: 'pointer', fontWeight: '500', color: '#5b46f5'
            }}>Continue with Google</button>
            <button onClick={onEmailClick} style={{
              padding: '16px', borderRadius: '50px', border: 'none', backgroundColor: '#333',
              fontSize: '1.1rem', cursor: 'pointer', color: 'white'
            }}>Continue with Email</button>
          </div>
        ) : (
          <form onSubmit={onRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
            <h2 style={{ color: 'white', textAlign: 'center' }}>Create Account</h2>
            <input type="email" placeholder="Email" style={{ padding: '12px', borderRadius: '8px', border: 'none' }} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" style={{ padding: '12px', borderRadius: '8px', border: 'none' }} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" style={{ padding: '14px', borderRadius: '50px', border: 'none', backgroundColor: '#333', color: 'white', cursor: 'pointer' }}>Sign Up</button>
            <p onClick={() => setView('auth')} style={{ color: 'white', textAlign: 'center', cursor: 'pointer', textDecoration: 'underline' }}>← Back</p>
          </form>
        )}
      </div>
    </div>
  );
};