import { Home, Bell, Calendar, User, Search, MessageCircle } from 'lucide-react';
import '../App.css'; 
import carRentalImg from '../assets/CarRental_pic.jpg';
import flightsImg from '../assets/Flights_pic.jpg';
import hotelsImg from '../assets/Hotels_pic.jpg';
import insuranceImg from '../assets/Insurances_pic.png';
import tripPlannerImg from '../assets/TripPlanner_pic.png';

// Placeholder constants for the scrolling sections
const IMAGES = {
  deal: "https://via.placeholder.com/200",
  promotion: "https://via.placeholder.com/200",
};

export const HomePage = () => {
  return (
    <div className="home-page fade-in">
      {/* --- Header Section --- */}
      <header className="home-header">ZenTravel</header>
      
      <main className="home-content">
        
        {/* --- Category Grid --- */}
        <div className="category-grid">
          {/* Hotels */}
          <div className="cat-box red">
            <img src={hotelsImg} alt="Hotels" className="cat-img" />
            <span className="cat-label">HOTELS</span>
          </div>
          
          {/* Flights */}
          <div className="cat-box orange">
            <img src={flightsImg} alt="Flights" className="cat-img" />
            <span className="cat-label">FLIGHTS</span>
          </div>
          
          {/* Insurance */}
          <div className="cat-box yellow">
            <img src={insuranceImg} alt="Insurance" className="cat-img" />
            <span className="cat-label">INSURANCE</span>
          </div>
          
          {/* Trip Planner */}
          <div className="cat-box green">
            <img src={tripPlannerImg} alt="Trip Planner" className="cat-img" />
            <span className="cat-label">TRIP PLANNER</span>
          </div>
          
          {/* Car Rental */}
          <div className="cat-box blue">
            <img src={carRentalImg} alt="Car Rental" className="cat-img" />
            <span className="cat-label">CAR RENTAL</span>
          </div>
        </div>

        {/* --- Search Section --- */}
        <div className="search-container">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
            <Search size={20} color="#7b2cbf" />
          </div>
          <div className="search-history">
            <span className="history-tag">search history</span>
            <span className="history-tag">search history</span>
            <span className="history-tag">search history</span>
          </div>
        </div>

        {/* --- AI Recommendation Section --- */}
        <div className="ai-recommendation">
          <h3>AI RECOMMENDATION</h3>
          <p>Your flight delay. Here schedule a new flight for you.</p>
          <span className="more-link">Press to know more</span>
        </div>

        {/* --- Special Deals (Horizontal Scroll) --- */}
        <section className="horizontal-section">
          <h4>Special Deals</h4>
          <div className="scroll-row">
            <div className="image-card yellow-light">
              <img src={IMAGES.deal} className="card-img" alt="Deal" />
            </div>
            <div className="image-card yellow-light">
              <img src={IMAGES.deal} className="card-img" alt="Deal" />
            </div>
            <div className="image-card yellow-light">
              <img src={IMAGES.deal} className="card-img" alt="Deal" />
            </div>
          </div>
        </section>

        {/* --- Flights Promotion (Horizontal Scroll) --- */}
        <section className="horizontal-section pb-100">
          <h4>Flights Promotion</h4>
          <div className="scroll-row">
            <div className="image-card orange-light">
              <img src={IMAGES.promotion} className="card-img" alt="Promo" />
            </div>
            <div className="image-card orange-light">
              <img src={IMAGES.promotion} className="card-img" alt="Promo" />
            </div>
            <div className="image-card orange-light">
              <img src={IMAGES.promotion} className="card-img" alt="Promo" />
              {/* Floating Chatbot Action */}
              <div className="chatbot-circle">
                <MessageCircle size={20} color="#333" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- Bottom Navigation Bar --- */}
      <nav className="bottom-nav">
        <div className="nav-item">
          <Home className="nav-icon active" />
        </div>
        <div className="nav-item">
          <Bell className="nav-icon" />
        </div>
        {/* Floating AI Button */}
        <div className="ai-floating-container">
          <div className="ai-floating-btn">AI</div>
        </div>
        <div className="nav-item">
          <Calendar className="nav-icon" />
        </div>
        <div className="nav-item">
          <User className="nav-icon" />
        </div>
      </nav>
    </div>
  );
};