import './App.css'
import logo from './assets/zentravel_logo.png'

function App() {
  return (
    <div className="landing-container">
      <div className="content-wrapper">
        <div className="logo-circle">
          <img src={logo} alt="ZenTravel Logo" className="logo-img" />
        </div>

        <h1 className="title">ZenTravel</h1>
        <p className="tagline">Peaceful journeys, powered by AI.</p>
      </div>
    </div>
  )
}

export default App