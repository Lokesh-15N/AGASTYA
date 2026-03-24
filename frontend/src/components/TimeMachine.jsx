import { useState } from 'react';
import { timeMachineCalculate } from '../api';
import { SectionTitle } from './Shared';

export default function TimeMachine({ fundId }) {
  const [amount, setAmount] = useState(100000);
  const [date, setDate] = useState('2020-03-24');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await timeMachineCalculate(fundId, date, amount);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <SectionTitle title="Time Machine What-If ⏳" />
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        What if you had the courage to invest during a historically terrible market crash? Pick an amount and a date to see what it would be worth today.
      </p>

      <form onSubmit={handleCalculate} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            style={{
              padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text-primary)', width: 150
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Investment Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text-primary)'
            }}
          />
        </div>

        <button type="submit" disabled={loading} style={{
          background: 'var(--accent)', color: '#fff', border: 'none', height: 40,
          padding: '0 24px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600
        }}>
          {loading ? 'Calculating...' : 'Go Back in Time'}
        </button>
      </form>

      {error && <div style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{
          background: 'var(--bg-card)', padding: 32, borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem' }}>
            If you invested <span style={{ color: 'var(--accent)' }}>₹{result.invested.toLocaleString()}</span> on {result.start_date}...
          </h3>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>It would be worth exactly:</p>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: result.abs_return >= 0 ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>
                ₹{result.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div style={{ paddingLeft: 32, borderLeft: '1px solid var(--border)' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 12 }}>Absolute Return:</span>
                <span style={{ fontWeight: 700, color: result.abs_return >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {result.abs_return > 0 ? '+' : ''}{result.abs_return}%
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 12 }}>CAGR:</span>
                <span style={{ fontWeight: 700 }}>{result.cagr}%</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: 12 }}>NAV Growth:</span>
                <span style={{ fontWeight: 500 }}>₹{result.start_nav} → ₹{result.latest_nav}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
