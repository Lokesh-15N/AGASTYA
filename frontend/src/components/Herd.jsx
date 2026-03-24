import { useState, useEffect } from 'react';
import { getHerd } from '../api';
import { Spinner, SectionTitle } from './Shared';

function HerdGauge({ score }) {
  const pct   = Math.min(score * 100, 100);
  const color = score > 0.75 ? 'var(--red)' : score > 0.5 ? 'var(--orange)' : score > 0.3 ? 'var(--amber)' : 'var(--green)';
  const emoji = score > 0.75 ? '🐑🐑🐑' : score > 0.5 ? '🐑🐑' : score > 0.3 ? '🐑' : '💪';

  return (
    <div style={{textAlign:'center', padding:'28px 0'}}>
      <div style={{fontSize:'3rem', marginBottom:12}}>{emoji}</div>
      <div style={{
        fontFamily:"'Space Grotesk',sans-serif",
        fontSize:'5rem', fontWeight:800,
        color, letterSpacing:'-0.06em', lineHeight:1,
        textShadow: `0 0 40px ${color}40`,
      }}>
        {pct.toFixed(0)}%
      </div>
      <div style={{marginTop:20, maxWidth:360, margin:'20px auto 0'}}>
        <div className="progress-bar" style={{height:12, borderRadius:99}}>
          <div
            className="progress-fill"
            style={{width:`${pct}%`, background:`linear-gradient(90deg, var(--green), ${color})`}}
          />
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:'0.7rem',color:'var(--text-muted)'}}>
          <span>Low Herd</span><span>Extreme Herd</span>
        </div>
      </div>
    </div>
  );
}

const PRESETS = [
  { label: 'COVID Crash (2020)',    start: '2020-02-01', end: '2020-05-31' },
  { label: 'NBFC Crisis (2018)',    start: '2018-09-01', end: '2018-12-31' },
  { label: 'Rate Hike Bear (2022)', start: '2022-01-01', end: '2022-07-31' },
  { label: 'Bull Run (2021)',       start: '2021-01-01', end: '2021-06-30' },
];

export default function Herd() {
  const [active, setActive] = useState(0);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const { start, end, label } = PRESETS[active];

  useEffect(() => {
    setLoading(true);
    setData(null);
    getHerd(start, end)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [start, end]);

  return (
    <>
      <SectionTitle icon="🐑">Herd Behavior Analysis</SectionTitle>
      <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginBottom:20,lineHeight:1.7}}>
        Herd score measures how synchronized investor exits are across multiple funds.
        A high score means everyone is fleeing together — a classic sign of panic-driven herd behavior.
      </p>

      {/* Period pills */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:24}}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            background: i===active ? 'var(--accent)' : 'var(--bg-card)',
            color: i===active ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${i===active ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:99, padding:'8px 18px', cursor:'pointer',
            fontSize:'0.82rem', fontWeight:600, fontFamily:'inherit',
            transition:'all 0.2s', boxShadow: i===active ? '0 0 16px var(--accent-glow)' : 'none',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Gauge card */}
      <div className="card chart-full" style={{marginBottom:24}}>
        <div className="card-header">
          <span className="card-title">Herd Score — {label}</span>
          <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{start} → {end}</span>
        </div>
        {loading ? <Spinner /> : data ? (
          <>
            <HerdGauge score={data.herd_score} />
            <div style={{textAlign:'center',marginTop:12}}>
              <div style={{
                display:'inline-block', padding:'8px 22px', borderRadius:99,
                background: data.herd_score > 0.75 ? 'rgba(244,63,94,0.12)' : data.herd_score > 0.5 ? 'rgba(251,146,60,0.12)' : 'rgba(34,211,160,0.1)',
                border: `1px solid ${data.herd_score > 0.75 ? 'rgba(244,63,94,0.4)' : data.herd_score > 0.5 ? 'rgba(251,146,60,0.4)' : 'rgba(34,211,160,0.3)'}`,
                fontSize:'0.9rem', fontWeight:800,
                color: data.herd_score > 0.75 ? 'var(--red)' : data.herd_score > 0.5 ? 'var(--orange)' : 'var(--green)',
              }}>
                {data.interpretation}
              </div>
              <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginTop:10}}>
                Correlation of outflows across {data.fund_count} funds · {start} to {end}
              </p>
            </div>
          </>
        ) : (
          <p style={{color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No data available.</p>
        )}
      </div>

      {/* Legend cards */}
      <SectionTitle icon="📖">Score Interpretation</SectionTitle>
      <div className="chart-grid">
        {[
          {range:'>80%', label:'Extreme Herd', color:'var(--red)',    icon:'🆘', desc:'Investors fleeing in unison. Classic crash territory. Stay invested — this is exactly when patience pays off.'},
          {range:'60–80%',label:'Strong Herd', color:'var(--orange)', icon:'🚨', desc:'Clear synchronized exit patterns. High risk of missing recovery if you sell now.'},
          {range:'40–60%',label:'Moderate Herd',color:'var(--amber)', icon:'⚠️', desc:'Some coordinated selling. Stay alert but do not act on fear.'},
          {range:'<40%', label:'Low Herd',     color:'var(--green)', icon:'✅', desc:'Investors are independent. Market functioning normally.'},
        ].map((c,i)=>(
          <div key={i} className="stat-card" style={{borderLeft:`3px solid ${c.color}`}}>
            <span className="icon" style={{fontSize:'1.8rem'}}>{c.icon}</span>
            <div style={{fontWeight:800,fontSize:'1.1rem',color:c.color,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>{c.range}</div>
            <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--text-primary)',marginBottom:6}}>{c.label}</div>
            <p style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.7}}>{c.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
