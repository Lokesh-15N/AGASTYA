import { useState } from 'react';
import { uploadPortfolio } from '../api';
import { SectionTitle } from './Shared';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', padding: '12px 16px',
        border: '1px solid var(--border)', borderRadius: 8
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 600 }}>
            {p.name}: ₹{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function UploadPortfolio() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await uploadPortfolio(file);
      setResults(res.data.analysis);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload and process portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <SectionTitle title="Calculate Your Personal Panic Tax 🧾" />
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Upload your mutual fund transaction statement (CSV from Zerodha Coin/Groww) to visually compare your actual returns against a disciplined SIP investor — and see exact Rupees lost to emotional panic selling.
      </p>

      {/* Upload Form */}
      <form onSubmit={handleUpload} style={{
        background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)', marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} style={{ color: 'var(--text-primary)', flex: 1 }} />
        <button type="submit" disabled={!file || loading} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '10px 28px', borderRadius: 8,
          cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          opacity: (!file || loading) ? 0.6 : 1, fontWeight: 700, fontSize: '0.95rem'
        }}>
          {loading ? '⏳ Calculating...' : '🔍 Upload & Analyze'}
        </button>
      </form>

      {error && (
        <div style={{ padding: 16, background: 'rgba(244,63,94,0.1)', color: 'var(--red)', borderRadius: 8, marginBottom: 20 }}>
          🚨 {error}
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {results.map((r, i) => {
            const barData = [
              { name: 'Your Portfolio', value: Math.round(r.actual_value) },
              { name: 'Disciplined SIP', value: Math.round(r.disc_value) },
            ];

            return (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{
                  padding: '20px 28px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Fund: <span style={{ color: 'var(--accent)' }}>{r.fund_id}</span></h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Invested: ₹{r.actual_invested.toLocaleString()} · Period covers all transactions
                    </p>
                  </div>
                  <div style={{
                    padding: '12px 20px', borderRadius: 10,
                    background: r.panic_tax > 0 ? 'rgba(244,63,94,0.12)' : 'rgba(34,211,160,0.12)',
                    border: `1.5px solid ${r.panic_tax > 0 ? 'var(--red)' : 'var(--green)'}`,
                    textAlign: 'right'
                  }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {r.panic_tax > 0 ? 'Personal Panic Tax' : 'Contrarian Bonus'}
                    </p>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: r.panic_tax > 0 ? 'var(--red)' : 'var(--green)', lineHeight: 1 }}>
                      {r.panic_tax > 0 ? '-' : '+'}₹{Math.abs(r.panic_tax).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Your Final Value', value: `₹${r.actual_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${r.actual_return_perc}% Return`, color: r.actual_return_perc >= 0 ? 'var(--green)' : 'var(--red)' },
                    { label: 'Disciplined Value', value: `₹${r.disc_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${r.disc_return_perc}% Return`, color: 'var(--green)' },
                    { label: 'Your Invested', value: `₹${r.actual_invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'Total capital put in', color: 'var(--text-muted)' },
                    { label: 'Disciplined Invested', value: `₹${r.disc_invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'Uniform monthly SIP', color: 'var(--text-muted)' },
                  ].map((kpi, ki) => (
                    <div key={ki} style={{
                      padding: '20px 24px',
                      borderRight: ki < 3 ? '1px solid var(--border)' : 'none'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</p>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{kpi.value}</div>
                      <div style={{ color: kpi.color, fontSize: '0.85rem', marginTop: 4 }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* MAIN: Area Chart — Growth Curves Head-to-Head */}
                {r.curve && r.curve.length > 0 && (
                  <div style={{ padding: '28px 28px 8px 8px' }}>
                    <h4 style={{ margin: '0 0 4px 28px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Portfolio Growth: You vs Disciplined Investor
                    </h4>
                    <p style={{ margin: '0 0 20px 28px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      The gap between the two curves is the direct financial cost of emotional selling decisions.
                    </p>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={r.curve} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`disc-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`actual-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={r.is_panic_seller ? "#f43f5e" : "#60a5fa"} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={r.is_panic_seller ? "#f43f5e" : "#60a5fa"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} minTickGap={24} />
                        <YAxis
                          stroke="var(--text-muted)"
                          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                          tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                          width={64}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingTop: 16 }} />
                        <Area
                          type="monotone"
                          dataKey="disciplined"
                          name="Disciplined SIP"
                          stroke="#22d3a0"
                          strokeWidth={2.5}
                          fill={`url(#disc-grad-${i})`}
                          dot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          name="Your Portfolio"
                          stroke={r.is_panic_seller ? "#f43f5e" : "#60a5fa"}
                          strokeWidth={2.5}
                          fill={`url(#actual-grad-${i})`}
                          dot={false}
                          strokeDasharray={r.is_panic_seller ? "5 3" : "0"}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* SECONDARY: Bar Chart — Final Wealth Showdown */}
                <div style={{ padding: '8px 28px 28px 8px' }}>
                  <h4 style={{ margin: '20px 0 4px 28px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Final Wealth: Head-to-Head
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-primary)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="value" name="Final Value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                        {barData.map((entry, index) => (
                          <Cell key={index} fill={index === 0 ? (r.is_panic_seller ? '#f43f5e' : '#60a5fa') : '#22d3a0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {results && results.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', padding: 20 }}>No valid transactions found matching the master dataset. Check fund IDs in your CSV (e.g., R002, P001).</p>
      )}
    </div>
  );
}
