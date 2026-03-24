import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea, Legend, Cell,
} from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { getCompare } from '../api';
import { Spinner, Fmt, SectionTitle } from './Shared';

function GrowthTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const gap = (d?.smart_investor || 0) - (d?.panic_seller || 0);
  return (
    <div style={{
      background:'var(--bg-card2)', border:'1px solid var(--border)',
      borderRadius:10, padding:'12px 16px', fontSize:'0.78rem', minWidth:210,
    }}>
      <p style={{color:'var(--text-muted)',marginBottom:8,fontWeight:600}}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{color:p.color, margin:'3px 0'}}>
          {p.name}: <strong style={{color:'var(--text-primary)'}}>
            ₹{Number(p.value).toLocaleString('en-IN',{maximumFractionDigits:0})}
          </strong>
        </p>
      ))}
      {gap > 0 && d?.is_panic === 1 && (
        <p style={{color:'var(--red)',marginTop:8,fontWeight:700,fontSize:'0.75rem'}}>
          🚨 Smart wins by ₹{gap.toLocaleString('en-IN',{maximumFractionDigits:0})} more vs panic
        </p>
      )}
    </div>
  );
}

/** Build contiguous [x1,x2] blocks from monthly chart_data */
function getPanicBlocks(rows) {
  const blocks = [];
  let x1 = null;
  rows.forEach((r, i) => {
    if (r.is_panic === 1 && x1 === null) x1 = r.date;
    if (r.is_panic === 0 && x1 !== null) {
      blocks.push({ x1, x2: rows[i - 1]?.date || x1 });
      x1 = null;
    }
  });
  if (x1) blocks.push({ x1, x2: rows[rows.length - 1]?.date });
  return blocks;
}

export default function Compare({ fundId }) {
  // Use full date range from API (dynamic)
  const { data, loading } = useFetch(
    () => import('../api').then(m => m.getCompare(fundId, undefined, undefined)),
    [fundId]
  );

  if (loading) return <Spinner />;
  if (!data) return null;

  const { disciplined: D, panic_seller: P, smart_investor: S,
          panic_tax: PT, smart_edge: SE, total_invested, years, panic_events } = data;

  const cagrRows = [
    { name: 'Disciplined', cagr: parseFloat(((D?.cagr||0)*100).toFixed(2)), fill: '#818cf8' },
    { name: 'Smart 🎯',    cagr: parseFloat(((S?.cagr||0)*100).toFixed(2)), fill: '#22d3a0' },
    { name: 'Panic',       cagr: parseFloat(((P?.cagr||0)*100).toFixed(2)), fill: '#f43f5e' },
  ];

  const panicBlocks = getPanicBlocks(data.chart_data || []);

  return (
    <>
      <SectionTitle icon="⚖️">Strategy Comparison</SectionTitle>

      {/* Stat cards row */}
      <div className="stat-grid" style={{marginBottom:24}}>
        <div className="stat-card" style={{borderTop:'3px solid var(--accent2)'}}>
          <span className="icon">🏆</span>
          <div className="label">Disciplined Final Value</div>
          <div className="value"><Fmt value={D?.final_value} /></div>
          <div className="delta up">▲ {D?.gain_pct?.toFixed(1)}% total gain</div>
        </div>
        <div className="stat-card" style={{borderTop:'3px solid var(--green)', background:'rgba(34,211,160,0.04)'}}>
          <span className="icon">🎯</span>
          <div className="label">Smart Investor Final Value</div>
          <div className="value" style={{color:'var(--green)'}}><Fmt value={S?.final_value} /></div>
          <div className="delta up">▲ Buys dips aggressively</div>
        </div>
        <div className="stat-card" style={{borderTop:'3px solid var(--red)', background:'rgba(244,63,94,0.04)'}}>
          <span className="icon">💸</span>
          <div className="label">Panic Tax Paid</div>
          <div className="value" style={{color:'var(--red)'}}><Fmt value={PT?.amount} /></div>
          <div className="delta down">▼ {PT?.percentage?.toFixed(1)}% of capital wasted</div>
        </div>
        <div className="stat-card" style={{borderTop:'3px solid var(--green)'}}>
          <span className="icon">⚡</span>
          <div className="label">Smart Edge over Disciplined</div>
          <div className="value" style={{color:'var(--green)'}}><Fmt value={SE?.amount} /></div>
          <div className="delta up">▲ {SE?.percentage?.toFixed(1)}% extra gain from dip-buying</div>
        </div>
      </div>

      {/* Portfolio Growth Curves */}
      <div className="card chart-full" style={{marginBottom:24}}>
        <div className="card-header">
          <span className="card-title">Portfolio Growth Curves</span>
          <div style={{display:'flex',gap:10,fontSize:'0.72rem',flexWrap:'wrap'}}>
            <span style={{color:'var(--green)'}}>● Smart Investor</span>
            <span style={{color:'var(--accent2)'}}>● Disciplined</span>
            <span style={{color:'var(--red)'}}>● Panic Seller</span>
            <span style={{color:'rgba(244,63,94,0.5)'}}>█ Panic Zone</span>
          </div>
        </div>
        <div className="chart-wrapper-lg">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart_data} margin={{top:8,right:12,bottom:0,left:4}}>
              <defs>
                <linearGradient id="smartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22d3a0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="panicGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.08)"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'var(--text-muted)'}}
                tickFormatter={d=>d.slice(0,7)} interval="preserveStartEnd"/>
              <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}}
                tickFormatter={v=>`₹${(v/1e5).toFixed(0)}L`}/>
              <Tooltip content={<GrowthTip/>}/>

              {/* Panic zone shading */}
              {panicBlocks.map((b,i)=>(
                <ReferenceArea key={i} x1={b.x1} x2={b.x2}
                  fill="rgba(244,63,94,0.07)" strokeOpacity={0}/>
              ))}

              {/* Lines - order matters: panic at bottom, smart on top */}
              <Area type="monotone" dataKey="panic_seller" name="Panic Seller"
                stroke="#f43f5e" strokeWidth={1.5} fill="url(#panicGrad)"
                dot={false} strokeDasharray="5 3"/>
              <Area type="monotone" dataKey="disciplined" name="Disciplined"
                stroke="#818cf8" strokeWidth={2} fill="url(#discGrad)" dot={false}/>
              <Area type="monotone" dataKey="smart_investor" name="Smart Investor 🎯"
                stroke="#22d3a0" strokeWidth={2.5} fill="url(#smartGrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insight strip */}
        <div style={{
          display:'flex', gap:20, marginTop:16, padding:'12px 16px',
          background:'rgba(34,211,160,0.06)', borderRadius:10,
          border:'1px solid rgba(34,211,160,0.2)', flexWrap:'wrap',
        }}>
          <div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Smart vs Panic Gap</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--green)'}}>
              +<Fmt value={(S?.final_value||0)-(P?.final_value||0)} />
            </div>
          </div>
          <div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Monthly SIP</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--text-primary)'}}>₹10,000</div>
          </div>
          <div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Smart adds during panic</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--green)'}}>₹20,000 / month</div>
          </div>
          <div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Years</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--text-primary)'}}>{years?.toFixed(1)} yrs</div>
          </div>
        </div>
      </div>

      {/* CAGR bar + Panic events */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">CAGR Comparison (%)</span></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cagrRows} margin={{top:8,right:16,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)"/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} tickFormatter={v=>v+'%'}/>
                <Tooltip formatter={v=>[v+'%','CAGR']}
                  contentStyle={{background:'var(--bg-card2)',border:'1px solid var(--border)',borderRadius:8,fontSize:'0.8rem'}}/>
                <Bar dataKey="cagr" name="CAGR %" radius={[6,6,0,0]}>
                  {cagrRows.map((r,i)=><Cell key={i} fill={r.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Panic Events Detected</span></div>
          {panic_events?.length > 0 ? (
            <table className="events-table">
              <thead>
                <tr><th>Start</th><th>End</th><th>NAV Drop</th><th>Sell NAV</th></tr>
              </thead>
              <tbody>
                {panic_events.map((e,i)=>(
                  <tr key={i}>
                    <td>{e.start}</td>
                    <td>{e.end}</td>
                    <td style={{color:'var(--red)',fontWeight:700}}>{e.nav_drop_pct}%</td>
                    <td style={{color:'var(--amber)'}}>₹{e.sell_at_nav}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{color:'var(--text-muted)',padding:'20px',textAlign:'center'}}>No panic events in this period.</p>
          )}
        </div>
      </div>
    </>
  );
}
