import React, { useState } from 'react';
import { Search, Calendar, User, ArrowLeft, X, Plus, Minus, Loader2, Star, MapPin } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { getHotels } from '../services/geminiService';
import "../styles/HotelsPage.css";

// --- Sub-Component: Results View ---
const ResultsView = ({ hotels, destination, searchDetails, onBack }: any) => (
  <div className="results-page fade-in">
    <header className="results-header">
      <ArrowLeft onClick={onBack} className="cursor-pointer" style={{ marginRight: '15px' }} />
      <div className="header-info">
        <h3>Hotels in {destination}</h3>
        <p>{searchDetails.nights} night(s) • {searchDetails.guests} guest(s)</p>
      </div>
    </header>
    
    <main className="results-grid">
      {hotels.length > 0 ? (
        hotels.map((hotel: any, i: number) => (
          <div key={i} className="hotel-detail-card fade-in">
            <div className="image-wrapper">
              <img 
                src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80&sig=${hotel.image_keyword || 'luxury'}`} 
                alt={hotel.name} 
              />
              <div className="rating-pill">
                <Star size={12} fill="currentColor" /> {hotel.rating}
              </div>
            </div>

            <div className="card-body">
              <div className="card-top">
                <h4>{hotel.name}</h4>
                <p className="location-pin"><MapPin size={14} /> {hotel.location}</p>
              </div>
              
              <div className="ai-badge">AI Recommendations</div>
              <p className="ai-description">"{hotel.description}"</p>
              
              <div className="amenities-row">
                {hotel.amenities?.slice(0, 3).map((a: string, idx: number) => (
                  <span key={idx} className="chip">{a}</span>
                ))}
              </div>

              <div className="card-footer">
                <div className="price-box">
                  <span className="price-val">{hotel.price}</span>
                  <span className="price-label">/night</span>
                </div>
                <button className="btn-book" onClick={() => alert(`Proceeding to book ${hotel.name}`)}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="no-results">No hotels found. Try a different search.</div>
      )}
    </main>
  </div>
);

// --- Main Component ---
export const HotelsPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const [viewMode, setViewMode] = useState<'search' | 'results'>('search');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-04-23");
  const [endDate, setEndDate] = useState("2026-04-24");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // --- Modal States ---
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // --- Logic ---
  const calculateNights = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleSearch = async () => {
    if (!destination) return alert("Please enter a destination!");
    
    setLoading(true);
    try {
      const totalGuests = adults + children;
      // Note: Ensure your geminiService exports 'getHotels'
      const data = await getHotels(destination, startDate, endDate, totalGuests);
      setHotels(data);
      setViewMode('results');
    } catch (err) {
      console.error("AI Search Error:", err);
      alert("AI is temporarily reaching its limit. Please wait a moment or check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // --- Conditional Rendering ---
  if (viewMode === 'results') {
    return (
      <ResultsView 
        hotels={hotels} 
        destination={destination} 
        searchDetails={{ nights: calculateNights(), guests: adults + children }}
        onBack={() => setViewMode('search')} 
      />
    );
  }

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="hotels-container">
        <h2 className="section-title">Hotels</h2>

        <div className="hotel-search-card">
          {/* 1. Destination */}
          <div className="search-row">
            <Search size={18} color="#7b2cbf" />
            <input 
              type="text" 
              placeholder="Enter destination" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* 2. Date Picker */}
          <div className="search-row clickable" onClick={() => setShowDateModal(true)}>
            <Calendar size={18} color="#7b2cbf" />
            <div className="row-text">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
            <span className="night-count">{calculateNights()} night(s)</span>
          </div>

          {/* 3. Guest Picker */}
          <div className="search-row clickable" onClick={() => setShowGuestModal(true)}>
            <User size={18} color="#7b2cbf" />
            <div className="row-text">
              {rooms} room, {adults} adults, {children} children
            </div>
          </div>

          <button 
            className="btn-primary-search" 
            onClick={handleSearch} 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Search"}
          </button>
        </div>
      </main>

      {/* --- MODAL: Date Selector --- */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal-card guest-modal" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowDateModal(false)} />
            <h3>Select Dates</h3>
            <div className="date-input-group">
              <label>Check-in</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <label>Check-out</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className="modal-action-btn" onClick={() => setShowDateModal(false)}>Confirm</button>
          </div>
        </div>
      )}

      {/* --- MODAL: Guest Selector --- */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal-card guest-modal" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowGuestModal(false)} />
            <h3>Occupancy</h3>
            
            <div className="counter-row">
              <span>Rooms</span>
              <div className="counter-controls">
                <Minus onClick={() => setRooms(Math.max(1, rooms - 1))} />
                <span>{rooms}</span>
                <Plus onClick={() => setRooms(rooms + 1)} />
              </div>
            </div>

            <div className="counter-row">
              <span>Adults</span>
              <div className="counter-controls">
                <Minus onClick={() => setAdults(Math.max(1, adults - 1))} />
                <span>{adults}</span>
                <Plus onClick={() => setAdults(adults + 1)} />
              </div>
            </div>

            <div className="counter-row">
              <span>Children</span>
              <div className="counter-controls">
                <Minus onClick={() => setChildren(Math.max(0, children - 1))} />
                <span>{children}</span>
                <Plus onClick={() => setChildren(children + 1)} />
              </div>
            </div>

            <button className="modal-action-btn" onClick={() => setShowGuestModal(false)}>Apply</button>
          </div>
        </div>
      )}

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};