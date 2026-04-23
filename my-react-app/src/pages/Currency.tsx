import React, { useState } from 'react';
import { ChevronLeft, Check, Search } from 'lucide-react';
import '../styles/Currency.css';

export const Currency = ({ setLocalView, currentCurrency, setCurrentCurrency }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allCurrencies = [
    { name: 'Malaysian Ringgit', code: 'RM | MYR' },
    { name: 'US Dollar', code: '$ | USD' },
    { name: 'Chinese Yuan', code: '¥ | RMB' },
    { name: 'British Pound', code: '£ | GBP' },
    { name: 'Australian Dollar', code: 'AUD | AUD' },
  ];

  const filtered = allCurrencies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="currency-page fade-in">
      <div className="currency-header">
        <ChevronLeft onClick={() => setLocalView('main')} className="back-icon" />
        <span>Select your currency</span>
      </div>
      <div className="search-container">
        <div className="search-bar">
          <Search size={18} /><input placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="currency-list-container">
        <p className="list-section-label">Choose a currency</p>
        {filtered.map((curr, i) => (
          <div key={i} className="currency-row" onClick={() => {
            setCurrentCurrency(curr); // 更新全局状态
            setLocalView('main');    // 返回 Profile
          }}>
            <div className="row-left">
              {currentCurrency === curr.code ? <Check size={18} color="#1a73e8" /> : <div style={{width: 18}} />}
              <span style={{ color: currentCurrency === curr.code ? '#1a73e8' : '#333' }}>{curr.name}</span>
            </div>
            <span className="currency-code-text">{curr.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
};