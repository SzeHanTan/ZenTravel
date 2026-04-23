import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Star } from 'lucide-react';
import mascotImg from '../assets/MASCOT.png'; 
import '../styles/MyReviews.css';

export const MyReviews = ({ setView }: { setView: (v: string) => void }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "reviews"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="reviews-page-root">
      <header className="zen-purple-header">
        <ArrowLeft className="header-icon-left" onClick={() => setView('profile')} />
        <h1 className="header-centered-title">My Reviews</h1>
        <div className="header-placeholder-right"></div>
      </header>

      <div className="white-content-area">
        {loading ? (
          <div className="empty-state-container"><p>Loading...</p></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state-container">
            <img src={mascotImg} alt="Mascot" className="mascot-img-center" />
            <p className="empty-msg-text">No reviews submitted yet.</p>
          </div>
        ) : (
          <div className="review-list-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card-item">
                <div className="review-hotel-header">
                  <img src={review.hotelImage} alt="hotel" className="small-hotel-img" />
                  <div className="hotel-meta-info">
                    <h4>{review.hotelName}</h4>
                    <p>{review.date}</p>
                  </div>
                  <div className="rating-pill">{review.rating}</div>
                </div>
                <p className="review-content-body">{review.content || "No review content submitted"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};