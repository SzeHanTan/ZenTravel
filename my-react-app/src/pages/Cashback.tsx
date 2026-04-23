import { useState } from 'react';
import { ChevronLeft, Wallet, Gift, History } from 'lucide-react';
import '../styles/Cashback.css';

export const Cashback = ({ setLocalView, balance, setBalance, symbol }: any) => {
  const [isClaiming, setIsClaiming] = useState(false);

  // 模拟计算逻辑（非 Hardcode）
  const handleClaim = () => {
    setIsClaiming(true);
    // 模拟随机奖励: 1.00 到 10.00 之间
    const randomReward = parseFloat((Math.random() * 9 + 1).toFixed(2));
    
    setTimeout(() => {
      setBalance((prev: number) => prev + randomReward);
      setIsClaiming(false);
      alert(`Success! You've claimed ${symbol} ${randomReward}`);
    }, 800);
  };

  return (
    <div className="cashback-container fade-in">
      {/* 头部：参考你的 Achievement 页面 */}
      <div className="sub-page-header">
        <ChevronLeft onClick={() => setLocalView('main')} className="back-icon" />
        <span>Cashback Rewards</span>
      </div>

      <div className="cashback-body">
        {/* 余额大卡片：参考 Settings 的圆角边框 */}
        <div className="ui-card balance-hero">
          <div className="balance-info">
            <p className="label">Available Balance</p>
            <h1 className="amount">{symbol} {balance.toFixed(2)}</h1>
          </div>
          <div className="wallet-illustration">
             <Wallet size={48} color="#7b2cbf" />
          </div>
        </div>

        {/* 任务部分：参考你的 Achievements 列表样式 */}
        <div className="ui-card">
          <h3 className="ui-card-title">Daily Missions</h3>
          <div className="ui-row clickable" onClick={!isClaiming ? handleClaim : undefined}>
            <Gift size={20} color="#7b2cbf" />
            <div className="row-content">
              <span className="row-title">Travel Reward</span>
              <p className="row-desc">Claim your weekly active travel bonus</p>
            </div>
            <span className="claim-btn">{isClaiming ? '...' : 'Claim'}</span>
          </div>
        </div>

        {/* 历史记录：参考 Settings 的排版 */}
        <div className="ui-card">
          <h3 className="ui-card-title"><History size={18} /> Recent Transactions</h3>
          <div className="ui-row no-click">
            <span>Hotel Booking Refund</span>
            <span className="ui-val positive">+{symbol} 15.00</span>
          </div>
          <div className="ui-row no-click">
            <span>Promo Reward</span>
            <span className="ui-val positive">+{symbol} 5.50</span>
          </div>
        </div>

        <button 
          className={`ui-logout-btn ${balance <= 0 ? 'disabled' : ''}`} 
          style={{ marginTop: '20px', background: balance > 0 ? '#7b2cbf' : '#ccc' }}
          disabled={balance <= 0}
        >
          WITHDRAW FUNDS
        </button>
      </div>
    </div>
  );
};