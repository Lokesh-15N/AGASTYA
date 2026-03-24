import { useState, useEffect } from 'react';
import './index.css';
import { getFunds } from './api';

import Overview from './components/Overview';
import NavChart  from './components/NavChart';
import Compare   from './components/Compare';
import Herd      from './components/Herd';
import Nudges    from './components/Nudges';
import Chatbot   from './components/Chatbot';
import UploadPortfolio from './components/UploadPortfolio';
import TimeMachine from './components/TimeMachine';
import LiveTicker from './components/LiveTicker';

const NAV_ITEMS = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'nav',      icon: '📉', label: 'NAV & Flows' },
  { id: 'compare',  icon: '⚖️',  label: 'Strategy Compare' },
  { id: 'herd',     icon: '🐑', label: 'Herd Behavior' },
  { id: 'nudges',   icon: '💡', label: 'Smart Nudges' },
  { id: 'timemachine', icon: '⏳', label: 'Time Machine' },
  { id: 'ticker',   icon: '⚡', label: 'Live Ticker (HFT)' },
  { id: 'upload',   icon: '📁', label: 'Portfolio Upload' },
  { id: 'chatbot',  icon: '🤖', label: 'AI Advisor' },
];

const PAGE_LABELS = {
  overview: 'Market Overview',
  nav:      'NAV & Investor Flows',
  compare:  'Disciplined vs Panic Strategy',
  herd:     'Herd Behavior Analysis',
  nudges:   'Smart Behavioral Nudges',
  timemachine: 'Time Machine (What-If)',
  ticker:   'High-Frequency Flash Crash Detector',
  upload:   'Personal Panic Tax',
  chatbot:  'AI Financial Advisor',
};

const DEFAULT_RANGE = { start: '2017-01-01', end: '2024-12-31' };

export default function App() {
  const [page,     setPage]   = useState('overview');
  const [fundId,   setFundId] = useState('R001');
  const [funds,    setFunds]  = useState([]);

  useEffect(() => {
    getFunds().then(r => setFunds(r.data)).catch(() => {});
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'overview': return <Overview fundId={fundId} />;
      case 'nav':      return <NavChart   fundId={fundId} />;
      case 'compare':  return <Compare    fundId={fundId} />;
      case 'herd':     return <Herd />;
      case 'nudges':   return <Nudges   fundId={fundId} />;
      case 'timemachine': return <TimeMachine fundId={fundId} />;
      case 'ticker':   return <LiveTicker />;
      case 'upload':   return <UploadPortfolio />;
      case 'chatbot':  return <Chatbot />;
      default:         return null;
    }
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">🐑 SheepOrSleep</div>
          <div className="logo-sub">Panic Intelligence Platform</div>
        </div>

        <span className="nav-group-label">Navigation</span>
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </button>
        ))}

        {/* bottom credit */}
        <div style={{
          marginTop: 'auto', padding: '20px',
          fontSize: '0.7rem', color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Data Range
          </div>
          Inception → Today
          <div style={{ marginTop: 6 }}>10 Funds · Real AMFI NAV Data</div>
        </div>
      </aside>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-title">
          <span>{PAGE_LABELS[page]}</span>
          {' '}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            — behavioral finance analytics
          </span>
        </div>

        <div className="fund-selector">
          <label htmlFor="fund-select">Fund:</label>
          <select
            id="fund-select"
            value={fundId}
            onChange={e => setFundId(e.target.value)}
          >
            {funds.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.category})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
