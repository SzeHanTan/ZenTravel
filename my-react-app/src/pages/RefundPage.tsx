import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import '../styles/RefundPage.css';

interface RefundPageProps {
  bookingId: string;
  setView: (view: any, id?: string) => void;
}

export const RefundPage = ({ bookingId, setView }: RefundPageProps) => {
  const [item, setItem] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  // 这里的理由已经为你选好：
  const refundReasons = [
    "Change of travel plans",
    "Found a better price elsewhere",
    "Booked the wrong date/time",
    "Personal medical reasons"
  ];

  // 核心逻辑：处理 Ticket(Timestamp) 和 其他(String) 的日期转换
  const formatDisplayDate = (val: any) => {
    if (!val) return "No Date";
    // 检查是否为 Firebase 的 Timestamp 对象
    if (typeof val === 'object' && val.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    // 如果是 String (Hotel/Transport) 则直接显示
    return String(val);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;
      try {
        const docRef = doc(db, "Booking", bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Firebase error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const handleConfirmRefund = async () => {
    if (!reason) return alert("Please select a reason for your refund.");
    try {
      await updateDoc(doc(db, "Booking", bookingId), {
        status: 'cancelled',
        refundReason: reason,
        refundRequestedAt: new Date().toISOString()
      });
      alert("Refund request submitted successfully!");
      setView('booking');
    } catch (e) {
      alert("Failed to submit refund. Please try again.");
    }
  };

  if (loading) return <div className="rf-white-bg"><p>Loading booking details...</p></div>;
  if (!item) return <div className="rf-white-bg"><p>Error: Booking not found.</p></div>;

  return (
    <div className="rf-white-bg">
      <header className="rf-purple-header">
        <ArrowLeft className="rf-clickable" color="white" onClick={() => setView('booking')} />
        <h1>ZenTravel</h1>
        <MessageSquare color="white" />
      </header>

      <main className="rf-main-content">
        <div className="rf-ticket-box">
          {/* 卡片顶部的日期和项目名称 */}
          <div className="rf-top-bar">
            <span>{formatDisplayDate(item.date || item.timeDepart)}</span>
            <span>{item.airline || item.name}</span>
          </div>

          <div className="rf-card-flex">
            {/* 左侧：显示行程（机票）或 详情（酒店/交通） */}
            <div className="rf-left-info">
              {item.type === 'flight' ? (
                <div className="rf-path-ui">
                  <span className="rf-city-name">{item.from}</span>
                  <div className="rf-purple-line"></div>
                  <span className="rf-city-name">{item.to}</span>
                </div>
              ) : (
                <div className="rf-simple-info">
                  <p className="rf-item-title">{item.name}</p>
                  <p className="rf-item-sub">{item.details || item.carType || "Booking Detail"}</p>
                </div>
              )}
            </div>

            {/* 右侧：紫色区域（包含单号和理由选择） */}
            <div className="rf-purple-action-card">
              <p className="rf-p-text">booking no: {item.bookingNum || item.bookNum}</p>
              <p className="rf-p-text">passenger: {item.passenger || item.name || "User"}</p>
              
              <div className="rf-reason-container">
                <label className="rf-label">Reason</label>
                <select 
                  className="rf-select-long" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Choose your reason</option>
                  {refundReasons.map((r, index) => (
                    <option key={index} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button className="rf-big-red-btn" onClick={handleConfirmRefund}>
          REFUND
        </button>
      </main>
    </div>
  );
};