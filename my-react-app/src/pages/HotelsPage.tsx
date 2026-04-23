import { useState } from 'react';
import { Search, Calendar, User, ArrowLeft, X, Plus, Minus } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import "../styles/HotelsPage.css";

export const HotelsPage = ({ setView }: { setView: (v: string) => void }) => {
  // --- Search States ---
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-04-23");
  const [endDate, setEndDate] = useState("2026-04-24");
  
  // --- Occupancy States ---
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // --- UI Toggles ---
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // --- Calculate Nights Logic ---
  const calculateNights = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="hotels-container">
        <h2 className="section-title">Hotels</h2>

        <div className="hotel-search-card">
          {/* 1. Destination Input */}
          <div className="search-row">
            <Search size={18} color="#7b2cbf" />
            <input 
              type="text" 
              placeholder="Enter destination" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* 2. Date Picker Trigger */}
          <div className="search-row clickable" onClick={() => setShowDateModal(true)}>
            <Calendar size={18} color="#7b2cbf" />
            <div className="row-text">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
            <span className="night-count">{calculateNights()} night(s)</span>
          </div>

          {/* 3. Guest Picker Trigger */}
          <div className="search-row clickable" onClick={() => setShowGuestModal(true)}>
            <User size={18} color="#7b2cbf" />
            <div className="row-text">
              {rooms} room, {adults} adults, {children} children
            </div>
          </div>

          <button className="btn-primary-search" onClick={() => console.log("Searching...")}>
            Search
          </button>
        </div>

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
      </main>

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};