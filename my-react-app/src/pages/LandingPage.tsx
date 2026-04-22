/* src/pages/LandingPage.tsx */
import logo from '../assets/zentravel_logo.png'

export const LandingPage = () => (
  <div className="landing-container fade-in">
    <div className="content-wrapper">
      <div className="logo-circle" style={{
        width: '220px', height: '220px', backgroundColor: 'white', 
        borderRadius: '50%', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', marginBottom: '60px', overflow: 'hidden'
      }}>
        <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
      </div>
      <h1 style={{ fontSize: '5rem', fontWeight: 500, margin: '0 0 40px 0', letterSpacing: '2px', color: 'black' }}>ZenTravel</h1>
      <p style={{ fontSize: '1.8rem', color: 'white', margin: 0, fontStyle: 'italic' }}>Peaceful journeys, powered by AI.</p>
    </div>
  </div>
);