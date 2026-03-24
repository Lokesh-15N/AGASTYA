import { useState, useEffect } from 'react';
import { getSummary, getPanicWindows } from '../api';
import { Spinner, Badge, Fmt, PctChange, SectionTitle } from './Shared';

function PanicBanner({ detection }) {
  if (!detection) return null;
  const sev = detection.severity;
  const cls = sev === 'NORMAL' ? 'normal' : sev === 'MODERATE' ? 'moderate' : 'panic';
  const icon = sev === 'NORMAL' ? '✅' : sev === 'EXTREME' ? '🆘' : sev === 'HIGH' ? '🚨' : '⚠️';
  const msg = sev === 'NORMAL'
    ? 'Markets are stable. No panic signals detected. Stay the course!'
    : detection.signals?.map(s => s.message).join('  ·  ') || '';

  return (
    <div className={`panic-banner ${cls}`}>
      <span className="panic-banner-icon">{icon}</span>
      <div>
        <div className="panic-banner-title">
          {sev === 'NORMAL' ? 'All Clear — Stay the Course' : `${sev} ALERT: Panic Signals Detected`}
          {'  '}<Badge severity={sev} />
        </div>
        <p className="panic-banner-sub">{msg}</p>
      </div>
    </div>
  );
}

export default function Overview({ fundId }) {
  const [summary, setSummary] = useState(null);
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    // fetch summary (may take a moment due to simulation)
    getSummary(fundId)
      .then(r => { setSummary(r.data); setLoading(false); })
      .catch(() => setLoading(false));
    // fetch panic windows independently (fast)
    getPanicWindows().then(r => setWindows(r.data)).catch(() => {});
  }, [fundId]);

  if (loading) return <Spinner />;
  if (!summary) return (
    <div className="loading-state">
      <span style={{fontSize:'2rem'}}>⚠️</span>
      <p>Could not load data. Make sure the backend is running on port 8000.</p>
      <code style={{fontSize:'0.75rem',color:'var(--accent2)'}}>python -m uvicorn main:app --reload --port 8000</code>
    </div>
  );

  const { detection, panic_tax_summary: pts, herd, nudges, panic_events_count } = summary;

  const statCards = [
    { icon: '📈', label: 'Current NAV',      value: `₹${summary.latest_nav?.toFixed(2)}` },
    { icon: '💸', label: 'Panic Tax',         value: <Fmt value={pts?.amount} />,
      extra: <><PctChange value={pts?.percentage} /> <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>of capital</span></> },
    { icon: '🏆', label: 'Disciplined CAGR',  value: `${((pts?.disciplined_cagr||0) * 100).toFixed(1)}%`,
      extra: <span className="delta up">▲ better returns</span> },
    { icon: '😰', label: 'Panic Seller CAGR', value: `${((pts?.panic_cagr||0) * 100).toFixed(1)}%`,
      extra: <span className="delta down">▼ underperformer</span> },
    { icon: '🐑', label: 'Herd Score',        value: `${((herd?.herd_score||0) * 100).toFixed(0)}%`,
      extra: <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{herd?.interpretation}</span> },
    { icon: '🚨', label: 'Panic Events',      value: panic_events_count,
      extra: <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>detected in 8 years</span> },
  ];

  return (
    <>
      <PanicBanner detection={detection} />

      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <span className="icon">{s.icon}</span>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
            {s.extra && <div style={{marginTop:6}}>{s.extra}</div>}
          </div>
        ))}
      </div>

      {windows?.length > 0 && (
        <>
          <SectionTitle icon="🗓️">Historical Panic Windows</SectionTitle>
          <div className="card chart-full">
            <table className="events-table">
              <thead>
                <tr><th>Event</th><th>Start</th><th>End</th><th>Severity</th></tr>
              </thead>
              <tbody>
                {windows.map((w, i) => (
                  <tr key={i}>
                    <td style={{color:'var(--text-primary)',fontWeight:600}}>{w.name}</td>
                    <td>{w.start}</td>
                    <td>{w.end}</td>
                    <td>
                      <span className={`badge ${i===1?'badge-extreme':'badge-panic'}`}>
                        <span className="badge-dot"/>
                        {i===1 ? 'EXTREME' : 'HIGH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {nudges?.length > 0 && (
        <>
          <SectionTitle icon="💡">Smart Nudges</SectionTitle>
          <div className="nudge-list">
            {nudges.map((n, i) => (
              <div className="nudge-card" key={i} style={{animationDelay:`${i*0.08}s`}}>
                <span className="nudge-icon">{n.icon}</span>
                <div>
                  <div className="nudge-title">{n.title}</div>
                  <div className="nudge-msg">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info footer */}
      <div style={{
        marginTop:24, padding:'20px 24px', borderRadius:'var(--radius)',
        background:'rgba(99,102,241,0.06)', border:'1px solid var(--border)',
        display:'flex', gap:24, flexWrap:'wrap',
      }}>
        {[
          {label:'Data Source', val:'Synthetic (AMFI-structured)'},
          {label:'Model',       val:'RandomForest + Rule-Based'},
          {label:'SIP Amount',  val:'₹10,000/month'},
          {label:'Reentry Delay',val:'60 business days'},
        ].map((f,i)=>(
          <div key={i}>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>{f.label}</div>
            <div style={{fontSize:'0.88rem',fontWeight:600,color:'var(--text-primary)'}}>{f.val}</div>
          </div>
        ))}
      </div>
    </>
  );
}
