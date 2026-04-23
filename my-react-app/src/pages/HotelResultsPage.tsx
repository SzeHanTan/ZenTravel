import React from 'react';
import { ArrowLeft, Star, MapPin, Sparkles, Calendar, Users, ChevronRight, Info } from 'lucide-react';
import "../styles/HotelsPage.css"; 

interface Hotel {
  name: string;
  location: string;
  price: string;
  rating: string;
  description: string;
  amenities: string[];
  image_keyword: string;
}

interface ResultsProps {
  hotels: Hotel[];
  destination: string;
  searchMeta: { startDate: string; endDate: string; guests: number; nights: number };
  onBack: () => void;
  onBook: (hotel: Hotel) => void;
}

export const HotelResultsPage: React.FC<ResultsProps> = ({ 
  hotels, destination, searchMeta, onBack, onBook 
}) => {
  return (
    <div className="zen-results-wrapper fade-in">
      {/* 1. STICKY HEADER */}
      <header className="zen-results-header">
        <div className="header-nav">
          <ArrowLeft onClick={onBack} className="back-button" size={24} />
          <div className="title-group">
            <h3>Stays in {destination || 'Destination'}</h3>
            <div className="meta-row">
              <span><Calendar size={14} /> {searchMeta?.startDate}</span>
              <span className="dot">•</span>
              <span><Users size={14} /> {searchMeta?.guests} Guests</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. RESULTS CONTENT */}
      <main className="zen-results-content">
        <div className="results-count-label">
          {hotels.length} Agent-Verified stays found
        </div>

        {hotels.map((h, i) => (
          <div key={i} className="organized-hotel-card">
            {/* Card Media (Image + Overlays) */}
            <div className="card-media">
              <img 
                src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80&sig=${h.image_keyword}`} 
                alt={h.name} 
              />
              <div className="rating-tag">
                <Star size={12} fill="currentColor" /> {h.rating}
              </div>
              <div className="agent-choice-badge">
                <Sparkles size={12} /> Agent Choice
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <h4 className="hotel-title">{h.name}</h4>
              <p className="location-text">
                <MapPin size={14} /> {h.location}
              </p>
              
              <div className="ai-insight-box">
                <Info size={14} className="insight-icon" />
                <p>"{h.description}"</p>
              </div>

              {/* Amenity Pills - FIXED: These are now separate tags */}
              <div className="amenities-row">
                {h.amenities?.map((amt, idx) => (
                  <span key={idx} className="amenity-pill">{amt}</span>
                ))}
              </div>

              {/* Card Footer: Price & Booking */}
              <div className="card-action-footer">
                <div className="price-container">
                  <span className="price-value">{h.price}</span>
                  <span className="price-label">/night</span>
                </div>
                <button className="zen-book-now-btn" onClick={() => onBook(h)}>
                  Book Stay <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};