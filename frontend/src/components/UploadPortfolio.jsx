import { useState } from 'react';
import { uploadPortfolio } from '../api';
import { SectionTitle } from './Shared';

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
        Upload your mutual fund transaction statement (CSV format from Zerodha Coin, Groww, etc.) to see how much emotional investing may have cost you compared to a strict SIP baseline.
      </p>

      <form onSubmit={handleUpload} style={{
        background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius)',
        border: '1px dashed var(--border)', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center'
      }}>
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          style={{ color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={!file || loading} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '8px 20px', borderRadius: 8, cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          opacity: (!file || loading) ? 0.6 : 1, fontWeight: 600
        }}>
          {loading ? 'Processing...' : 'Upload & Analyze'}
        </button>
      </form>

      {error && (
        <div style={{ padding: 16, background: 'rgba(244,63,94,0.1)', color: 'var(--red)', borderRadius: 8, marginBottom: 20 }}>
          🚨 {error}
        </div>
      )}

      {results && results.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>Your Personal Panic Tax Results</h3>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {results.map((r, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', padding: 20, borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', flex: '1 1 300px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', fontSize: '1.1rem' }}>Fund: {r.fund_id}</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
                  <div style={{ background: 'var(--bg-card2)', padding: 12, borderRadius: 8 }}>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Your Actual Value</p>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{r.actual_value.toLocaleString()}</div>
                    <div style={{ color: r.actual_return_perc >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.8rem' }}>
                      {r.actual_return_perc}% Return
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card2)', padding: 12, borderRadius: 8, border: '1px solid rgba(34,211,160,0.3)' }}>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '0.75rem', textTransform: 'uppercase' }}>Disciplined Value</p>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{r.disc_value.toLocaleString()}</div>
                    <div style={{ color: 'var(--green)', fontSize: '0.8rem' }}>
                      {r.disc_return_perc}% Return
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 16, padding: '16px', borderRadius: 8,
                  background: r.panic_tax > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(34,211,160,0.08)',
                  border: `1px solid ${r.panic_tax > 0 ? 'var(--red)' : 'var(--green)'}`
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {r.panic_tax > 0 ? 'Your Personal Panic Tax:' : 'Your Contrarian Bonus:'}
                  </p>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: r.panic_tax > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {r.panic_tax > 0 ? '-' : '+'}₹{Math.abs(r.panic_tax).toLocaleString()}
                  </div>
                  {r.is_panic_seller && (
                    <p style={{ color: 'var(--red)', fontSize: '0.8rem', margin: '8px 0 0 0' }}>
                      ⚠️ You lost money due to early exits during market volatility.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No valid transactions found bridging the master dataset.</p>
      )}
    </div>
  );
}
