import React, { useState } from 'react';
import { ArrowLeft, Calendar, X, Check } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import "../styles/TripPlannerPage.css";

export const TripPlannerPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const [origin, setOrigin] = useState("Kuala Lumpur");
  const [destination, setDestination] = useState("London");
  const [dates, setDates] = useState({ start: "23/04/2026", end: "29/04/2026" });
  
  // --- UI Toggles ---
  const [showDateModal, setShowDateModal] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);

  // --- Preferences State ---
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [otherNeeds, setOtherNeeds] = useState("");

  const categories = [
    { label: "Travel companions", items: ["🚶 Solo", "👪 Family", "💑 Couple", "👬 Friends", "👵 Elderly"] },
    { label: "Travel style", items: ["🚩 Cultural", "🌟 Classic", "🍃 Nature", "🌇 Cityscape", "🏛️ Historical"] },
    { label: "Travel pace", items: ["📅 Ambitious", "🕒 Moderate", "🌴 Relaxed"] },
    { label: "Accommodation", items: ["Comfort", "Premium", "Luxury"] },
    { label: "Day's rhythm", items: ["🐦 Early starts", "🦉 Late nights"] }
  ];

  const togglePref = (item: string) => {
    setSelectedPrefs(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="insurance-container">
        <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Trip Planner</p>

        <div className="insurance-card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Starting From */}
          <div className="planner-row">
            <span className="label-black">Starting from</span>
            <span className="row-text-right">{origin}</span>
          </div>

          {/* Heading To */}
          <div className="planner-row-vertical">
            <div className="planner-row-header">
                <span className="label-black">Heading To</span>
                <span style={{ color: '#7b2cbf', fontWeight: 'bold' }}>&gt;</span>
            </div>
            <div className="destinations-scroll">
              {["London", "Melbourne", "Sydney", "Tokyo", "Paris"].map(d => (
                <div 
                  key={d} 
                  className={`dest-card ${destination === d ? 'selected' : ''}`} 
                  onClick={() => setDestination(d)}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Date Row */}
          <div className="planner-row clickable" onClick={() => setShowDateModal(true)}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Calendar size={20} color="#7b2cbf" />
                <span className="row-text-black">{dates.start} - {dates.end}</span>
            </div>
          </div>

          {/* Preferences Trigger */}
          <div className="preferences-trigger-row" onClick={() => setShowPrefModal(true)}>
             <div className="preferences-header-text">Preferences</div>
             <div className="preferences-arrow">&gt;</div>
          </div>

          {/* Main Action Buttons */}
          <div style={{ padding: '20px' }}>
            <button className="confirm-btn-purple" onClick={() => setView('chatbot')}>
              Plan a Trip with AI
            </button>
            
            <button className="btn-outline-zen" onClick={() => setView('manual-planner')}>
              Create It Myself
            </button>
          </div>
        </div>

        {/* --- MODAL: Preferences (The Pop-up) --- */}
        {showPrefModal && (
          <div className="modal-overlay" onClick={() => setShowPrefModal(false)}>
            <div className="modal-card pref-pop-up" onClick={e => e.stopPropagation()}>
              <X className="close-icon" onClick={() => setShowPrefModal(false)} />
              <h3 className="modal-title-purple" style={{ fontSize: '1.2rem' }}>Choose your preferences</h3>
              
              <div className="pref-scroll-area">
                {categories.map(cat => (
                  <div key={cat.label} className="preference-section">
                    <span className="section-label">{cat.label}</span>
                    <div className="chips-container">
                      {cat.items.map(item => (
                        <div 
                          key={item} 
                          className={`chip ${selectedPrefs.includes(item) ? 'active' : ''}`}
                          onClick={() => togglePref(item)}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <span className="section-label">Other needs</span>
                <textarea 
                    className="preferences-input" 
                    placeholder="Enter more preferences here" 
                    value={otherNeeds}
                    onChange={(e) => setOtherNeeds(e.target.value)}
                    rows={3} 
                />
              </div>

              <button className="confirm-btn-purple" style={{ background: '#4461F2' }} onClick={() => setShowPrefModal(false)}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Date Modal - Reusing your design */}
        {showDateModal && (
          <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
            <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
              <X className="close-icon" onClick={() => setShowDateModal(false)} />
              <h3 className="modal-title-purple">Select Dates</h3>
              <div className="date-input-section">
                <label className="date-label">Check-in</label>
                <div className="custom-date-input"><input type="date" /></div>
                <label className="date-label" style={{marginTop: '15px'}}>Check-out</label>
                <div className="custom-date-input"><input type="date" /></div>
              </div>
              <button className="confirm-btn-purple" onClick={() => setShowDateModal(false)}>Confirm</button>
            </div>
          </div>
        )}
      </main>

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};