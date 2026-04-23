import React, { useState } from 'react';
import { Search, Calendar, User, ArrowLeft, X, Plus, Minus, Loader2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { runHotelSearchWorkflow } from '../agents/workflowEngine';
import { db } from '../services/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { HotelResultsPage } from './HotelResultsPage';
import "../styles/HotelsPage.css";

export const HotelsPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const [viewMode, setViewMode] = useState<'search' | 'results'>('search');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);

  // --- Search Form States ---
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-04-23");
  const [endDate, setEndDate] = useState("2026-04-24");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // --- Modal Toggles ---
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const calculateNights = () => {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleSearch = async () => {
    if (!destination) return alert("Please enter a destination!");
    setLoading(true);
    try {
      const result = await runHotelSearchWorkflow(destination, startDate, endDate, adults + children);
      const hAction = result.plan?.actions.find(a => a.agent === 'hotel');

      if (hAction?.status === 'completed' && hAction.output) {
        setHotels(JSON.parse(hAction.output));
        setViewMode('results');
      } else {
        throw new Error("Timeout");
      }
    } catch (err) {
      console.warn("AI Timeout - Loading Demo Stays instead.");
      // 🚀 EMERGENCY FALLBACK DATA
      const demoHotels = [
        {
          name: `${destination} Grand Resort`,
          location: "City Center",
          price: "$250",
          rating: "4.8",
          description: "A beautiful placeholder stay used while the AI Agent is warming up.",
          amenities: ["WiFi", "Pool", "Spa"],
          image_keyword: "resort"
        }
      ];
      setHotels(demoHotels);
      setViewMode('results');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (hotel: any) => {
    try {
      const bookingData = {
        bookingNum: `GK${Math.floor(1000 + Math.random() * 9000)}`,
        cashbackClaimed: false,
        date: startDate,
        details: `${rooms} room, ${calculateNights()} nights`,
        hasNotification: true,
        hasReviewed: false,
        imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&sig=${hotel.image_keyword}`,
        name: hotel.name,
        passenger: "wanyee",
        price: parseInt(hotel.price.replace(/[^0-9]/g, "")) || 500,
        status: "upcoming",
        type: "hotel",
        userId: "4mLjskOCkeUgoXxHA5K6" 
      };
      await addDoc(collection(db, "Booking"), bookingData);
      alert(`Success! Booked ${hotel.name}.`);
      setView('booking');
    } catch (err) {
      alert("Firebase save failed.");
    }
  };

  if (viewMode === 'results') {
    return (
      <HotelResultsPage 
        hotels={hotels} 
        destination={destination}
        searchMeta={{ startDate, endDate, guests: adults + children, nights: calculateNights() }}
        onBack={() => setViewMode('search')}
        onBook={handleBooking}
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

          {/* 2. Date Selection */}
          <div className="search-row clickable" onClick={() => setShowDateModal(true)}>
            <Calendar size={18} color="#7b2cbf" />
            <div className="row-text">
              {startDate} - {endDate}
            </div>
            <span className="night-count">{calculateNights()} night(s)</span>
          </div>

          {/* 3. Occupancy Selection */}
          <div className="search-row clickable" onClick={() => setShowGuestModal(true)}>
            <User size={18} color="#7b2cbf" />
            <div className="row-text">
              {rooms} room, {adults} adults, {children} children
            </div>
          </div>

          <button className="btn-primary-search" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Search with AI Agents"}
          </button>
        </div>

        {/* --- MODAL: Dates (Restored Design) --- */}
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

        {/* --- MODAL: Occupancy (Restored Design) --- */}
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