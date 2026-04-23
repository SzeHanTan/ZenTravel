import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Trash2, MapPin, 
  Clock, Utensils, Building2, Plane, Camera 
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import "../styles/TripPlannerPage.css";

interface Activity {
  id: string;
  type: 'Flight' | 'Stay' | 'Food' | 'Activity';
  time: string;
  location: string;
  description: string;
}

interface DayPlan {
  dayNumber: number;
  activities: Activity[];
}

export const ManualPlannerPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const [itinerary, setItinerary] = useState<DayPlan[]>([
    { dayNumber: 1, activities: [] }
  ]);

  const addDay = () => {
    setItinerary([...itinerary, { dayNumber: itinerary.length + 1, activities: [] }]);
  };

  const addBlock = (dayIdx: number, type: Activity['type']) => {
    const newItin = [...itinerary];
    const newActivity: Activity = {
      id: Date.now().toString(), 
      type: type,
      time: "12:00",
      location: "",
      description: ""
    };
    newItin[dayIdx].activities.push(newActivity);
    setItinerary(newItin);
  };

  const updateBlock = (dayIdx: number, blockId: string, field: keyof Activity, value: string) => {
    const newItin = [...itinerary];
    const block = newItin[dayIdx].activities.find(a => a.id === blockId);
    if (block) {
      (block as any)[field] = value;
      setItinerary(newItin);
    }
  };

  // Logic: Removes a specific block from a day
  const removeBlock = (dayIdx: number, blockId: string) => {
    const newItin = [...itinerary];
    newItin[dayIdx].activities = newItin[dayIdx].activities.filter(a => a.id !== blockId);
    setItinerary(newItin);
  };

  // Helper: Returns the correct icon based on activity type
  const getIcon = (type: string) => {
    switch(type) {
      case 'Flight': return <Plane size={18} />;
      case 'Stay': return <Building2 size={18} />;
      case 'Food': return <Utensils size={18} />;
      default: return <Camera size={18} />;
    }
  };

  return (

    <div className="home-page fade-in">
      {/* Header with back navigation to Trip Planner */}
      <header className="home-header">
        <ArrowLeft onClick={() => setView('tripplanner')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        Manual Trip Builder
      </header>

      <main className="insurance-container" style={{ paddingBottom: '120px' }}>
        {/* Dynamic Summary Card */}
        <div className="trip-summary-mini">
           <h3>My Custom Trip</h3>
           <p>{itinerary.length} Day{itinerary.length > 1 ? 's' : ''} Planned</p>
        </div>

        {/* Day-by-Day Mapping */}
        {itinerary.map((day, dIdx) => (
          <section key={dIdx} className="day-block">
            <div className="day-block-header">
              <h2>Day {day.dayNumber}</h2>
              {/* Only show delete day button if there's more than 1 day */}
              {itinerary.length > 1 && (
                <Trash2 
                  size={18} 
                  color="#ff4d4d" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setItinerary(itinerary.filter((_, i) => i !== dIdx))} 
                />
              )}
            </div>

            {/* Activity Block Mapping */}
            <div className="activity-list">
              {day.activities.map((act) => (
                <div key={act.id} className="plan-card">
                  {/* Sidebar changes color based on data-type via CSS */}
                  <div className="plan-card-sidebar" data-type={act.type}>
                    {getIcon(act.type)}
                  </div>
                  
                  <div className="plan-card-content">
                    <div className="plan-input-group">
                      <Clock size={14} />
                      <input 
                        type="time" 
                        className="plan-time-input"
                        value={act.time} 
                        onChange={(e) => updateBlock(dIdx, act.id, 'time', e.target.value)}
                      />
                      <Trash2 
                        size={14} 
                        className="delete-item" 
                        onClick={() => removeBlock(dIdx, act.id)} 
                      />
                    </div>

                    <input 
                      className="plan-desc-input"
                      placeholder={act.type === 'Stay' ? "Hotel/Stay Name" : "Activity Description"} 
                      value={act.description}
                      onChange={(e) => updateBlock(dIdx, act.id, 'description', e.target.value)}
                    />

                    <div className="plan-input-group">
                      <MapPin size={14} />
                      <input 
                        className="plan-loc-input"
                        placeholder="Location/Address" 
                        value={act.location}
                        onChange={(e) => updateBlock(dIdx, act.id, 'location', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Block Picker: Choose what type of activity to add */}
            <div className="block-picker">
              <button onClick={() => addBlock(dIdx, 'Flight')}><Plane size={14}/> Flight</button>
              <button onClick={() => addBlock(dIdx, 'Stay')}><Building2 size={14}/> Stay</button>
              <button onClick={() => addBlock(dIdx, 'Food')}><Utensils size={14}/> Food</button>
              <button onClick={() => addBlock(dIdx, 'Activity')}><Camera size={14}/> Event</button>
            </div>
          </section>
        ))}

        {/* Big button to add the next day */}
        <button className="add-day-btn-large" onClick={addDay}>
          <Plus size={20} /> Add Next Day
        </button>
      </main>

      {/* Save Area: Persistent at the bottom above navigation */}
      <div className="floating-save-area">
         <button className="confirm-btn-purple" onClick={() => setView('home')}>
           Save Itinerary
         </button>
      </div>

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};