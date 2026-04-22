import logo from '../assets/zentravel_logo.png'

export const LandingPage = () => (
  <div className="landing-container fade-in">
    <div className="content-wrapper">
      <div className="logo-circle">
        <img src={logo} className="logo-img" alt="Logo" />
      </div>
      <h1 className="title">ZenTravel</h1>
      <p className="tagline">Peaceful journeys, powered by AI.</p>
    </div>
  </div>
);