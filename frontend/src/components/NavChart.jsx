import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { getNavData } from '../api';
import { Spinner, SectionTitle } from './Shared';

function CustomTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background:'var(--bg-card2)', border:'1px solid var(--border)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.78rem', minWidth:160,
    }}>
      <p style={{color:'var(--text-muted)',marginBottom:6}}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{color:p.color, margin:'3px 0'}}>
          {p.name}: <strong style={{color:'var(--text-primary)'}}>
            {typeof p.value==='number' ? p.value.toFixed(2) : p.value}
          </strong>
        </p>
      ))}
      {d?.is_panic===1 && (
        <p style={{color:'var(--red)',marginTop:6,fontWeight:700}}>🚨 Panic Zone</p>
      )}
    </div>
  );
}

/** Build contiguous panic windows from weekly data */
function getPanicWindows(rows) {
  const windows = [];
  let wStart = null;
  rows.forEach((r, i) => {
    if (r.is_panic === 1 && wStart === null) wStart = r.date;
    if (r.is_panic === 0 && wStart !== null) {
      windows.push({ x1: wStart, x2: rows[i - 1]?.date || wStart });
      wStart = null;
    }
  });
  if (wStart !== null) windows.push({ x1: wStart, x2: rows[rows.length - 1]?.date });
  return windows;
}

export default function NavChart({ fundId, start, end }) {
  const { data, loading } = useFetch(() => getNavData(fundId, start, end), [fundId, start, end]);

  if (loading) return <Spinner />;
  if (!data?.data) return null;

  const rows = data.data;
  const panicZones = getPanicWindows(rows);

  const PanicZones = () => panicZones.map((z, i) => (
    <ReferenceArea key={i} x1={z.x1} x2={z.x2}
      fill="rgba(244,63,94,0.08)" fillOpacity={1}
      stroke="rgba(244,63,94,0.2)" strokeWidth={0} />
  ));

  return (
    <>
      <SectionTitle icon="📉">NAV &amp; Market Trend</SectionTitle>

      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{
          fontSize:'0.72rem', padding:'3px 10px', borderRadius:99,
          background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)',
          color:'var(--red)', fontWeight:600,
        }}>🔴 Red regions = detected panic periods</span>
      </div>

      <div className="chart-grid">
        {/* NAV chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">NAV over Time</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{top:4,right:8,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'var(--text-muted)'}}
                  tickFormatter={d=>d.slice(0,7)} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}}
                  domain={['auto','auto']} tickFormatter={v=>v.toFixed(0)}/>
                <Tooltip content={<CustomTip/>}/>
                <PanicZones/>
                <Area type="monotone" dataKey="nav" name="NAV (₹)"
                  stroke="#818cf8" strokeWidth={2} fill="url(#navGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Flow chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Investor Net Flows (₹ Cr)</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{top:4,right:8,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="flowGrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'var(--text-muted)'}}
                  tickFormatter={d=>d.slice(0,7)} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} tickFormatter={v=>v.toFixed(0)}/>
                <Tooltip content={<CustomTip/>}/>
                <ReferenceLine y={0} stroke="rgba(99,115,210,0.4)" strokeDasharray="3 3"/>
                <PanicZones/>
                <Area type="monotone" dataKey="net_flow" name="Net Flow (₹ Cr)"
                  stroke="#22d3a0" strokeWidth={2} fill="url(#flowGrade)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Volatility */}
      <SectionTitle icon="〰️">7-Day Rolling Volatility</SectionTitle>
      <div className="card chart-full">
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'var(--text-muted)'}}
                tickFormatter={d=>d.slice(0,7)} interval="preserveStartEnd"/>
              <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}}
                tickFormatter={v=>(v*100).toFixed(2)+'%'}/>
              <Tooltip content={<CustomTip/>} formatter={v=>[(v*100).toFixed(3)+'%','Volatility']}/>
              <PanicZones/>
              <Line type="monotone" dataKey="vol_7d" name="Volatility"
                stroke="#fbbf24" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{marginTop:10,fontSize:'0.75rem',color:'var(--text-muted)',textAlign:'center'}}>
          Shaded red regions indicate detected panic periods
        </div>
      </div>
    </>
  );
}
