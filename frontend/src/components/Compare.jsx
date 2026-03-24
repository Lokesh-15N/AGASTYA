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
  const diff = (d?.disciplined || 0) - (d?.panic_seller || 0);
  return (
    <div style={{
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem', minWidth: 190,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '3px 0' }}>
          {p.name}: <strong style={{ color: 'var(--text-primary)' }}>₹{Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
        </p>
      ))}
      {diff > 0 && (
        <p style={{ color: 'var(--green)', marginTop: 6, fontWeight: 700 }}>
          Panic Tax: ₹{diff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      )}
    </div>
  );
}

export default function Compare({ fundId, start, end }) {
  const { data, loading } = useFetch(() => getCompare(fundId, start, end), [fundId, start, end]);

  if (loading) return <Spinner />;
  if (!data) return null;

  const { disciplined: D, panic_seller: P, panic_tax: PT, total_invested, years, panic_events } = data;

  const cmpRows = [
    { name: 'Final Value', disciplined: D.final_value, panic: P.final_value },
    { name: 'Absolute Gain', disciplined: D.absolute_gain, panic: P.absolute_gain },
  ];

  const cagrRows = [
    { name: 'Disciplined', cagr: (D.cagr * 100).toFixed(2) },
    { name: 'Panic Seller', cagr: (P.cagr * 100).toFixed(2) },
  ];

  return (
    <>
      {/* Summary cards */}
      <SectionTitle icon="⚖️">Strategy Comparison</SectionTitle>
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="icon">🏆</span>
          <div className="label">Disciplined Final Value</div>
          <div className="value"><Fmt value={D.final_value} /></div>
          <div className="delta up">▲ {D.gain_pct.toFixed(1)}% total gain</div>
        </div>
        <div className="stat-card">
          <span className="icon">😰</span>
          <div className="label">Panic Seller Final Value</div>
          <div className="value"><Fmt value={P.final_value} /></div>
          <div className="delta down">▼ {Math.abs(P.gain_pct).toFixed(1)}% returns</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.25)' }}>
          <span className="icon">💸</span>
          <div className="label">Panic Tax (Money Lost)</div>
          <div className="value" style={{ color: 'var(--red)' }}><Fmt value={PT.amount} /></div>
          <div className="delta down">▼ {PT.percentage.toFixed(1)}% of invested capital</div>
        </div>
        <div className="stat-card">
          <span className="icon">📅</span>
          <div className="label">Period</div>
          <div className="value">{years.toFixed(1)} yrs</div>
          <div className="card-sub">Total invested: <Fmt value={total_invested} /></div>
        </div>
      </div>

      {/* Growth curves */}
      <div className="card chart-full" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Portfolio Growth Curves</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly SIP ₹10,000</span>
        </div>
        <div className="chart-wrapper-lg">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart_data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="panicGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickFormatter={d => d.slice(0, 7)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`} />
              <Tooltip content={<GrowthTip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 12 }} />
              {/* panic zone highlights */}
              {data.chart_data?.filter(r => r.is_panic === 1).map((r, i) => (
                <ReferenceLine key={i} x={r.date} stroke="rgba(244,63,94,0.12)" strokeWidth={5} />
              ))}
              <Area type="monotone" dataKey="disciplined" name="Disciplined Investor"
                stroke="#22d3a0" strokeWidth={2} fill="url(#discGrad)" dot={false} />
              <Area type="monotone" dataKey="panic_seller" name="Panic Seller"
                stroke="#f43f5e" strokeWidth={2} fill="url(#panicGrad)" dot={false} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CAGR bar */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">CAGR Comparison (%)</span></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cagrRows} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,115,210,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => v + '%'} />
                <Tooltip formatter={v => [v + '%', 'CAGR']} contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="cagr" name="CAGR %" radius={[6, 6, 0, 0]}>
                  {cagrRows.map((r, i) => (
                    <Cell key={i} fill={i === 0 ? '#22d3a0' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panic events */}
        <div className="card">
          <div className="card-header"><span className="card-title">Panic Events Detected</span></div>
          {panic_events?.length > 0 ? (
            <table className="events-table">
              <thead><tr><th>Start</th><th>End</th><th>NAV Drop</th></tr></thead>
              <tbody>
                {panic_events.map((e, i) => (
                  <tr key={i}>
                    <td>{e.start}</td>
                    <td>{e.end}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 700 }}>{e.nav_drop_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
              No panic events in selected range.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
