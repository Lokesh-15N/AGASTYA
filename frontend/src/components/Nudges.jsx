import { useFetch } from '../hooks/useFetch';
import { getNudges } from '../api';
import { Spinner, SectionTitle, Badge } from './Shared';

function NudgeCard({ nudge, index }) {
  return (
    <div
      className="nudge-card"
      style={{
        animationDelay: `${index * 0.1}s`,
        borderLeft: nudge.type === 'loss_aversion'
          ? '3px solid var(--red)'
          : nudge.type === 'herd'
          ? '3px solid var(--amber)'
          : nudge.type === 'calm'
          ? '3px solid var(--green)'
          : '3px solid var(--accent)',
        padding: '18px 20px',
      }}
    >
      <span className="nudge-icon" style={{ fontSize: '2rem' }}>{nudge.icon}</span>
      <div>
        <div className="nudge-title" style={{ fontSize: '1rem' }}>{nudge.title}</div>
        <div className="nudge-msg" style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>{nudge.message}</div>
        <div style={{ marginTop: 10 }}>
          <span style={{
            fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99,
            background: 'var(--bg-card2)', color: 'var(--text-muted)',
            border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {nudge.type?.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}

const BEHAVIORAL_BIASES = [
  {
    icon: '😱', name: 'Loss Aversion',
    desc: 'Investors feel the pain of losses ~2× more than equivalent gains. This leads to panic selling at the worst possible time.',
    color: 'var(--red)',
  },
  {
    icon: '🐑', name: 'Herd Mentality',
    desc: 'Seeing others sell triggers a psychological need to follow. The crowd is often wrong at market peaks and troughs.',
    color: 'var(--amber)',
  },
  {
    icon: '📰', name: 'Recency Bias',
    desc: 'Recent negative events feel permanent. "The market will never recover" is a classic recency bias trap.',
    color: 'var(--orange)',
  },
  {
    icon: '🔮', name: 'Overconfidence',
    desc: 'Believing you can time the market is statistically impossible for retail investors. Consistent SIP beats market timing.',
    color: 'var(--accent2)',
  },
];

export default function Nudges({ fundId }) {
  const { data, loading } = useFetch(() => getNudges(fundId), [fundId]);

  return (
    <>
      <SectionTitle icon="💡">Personalized Smart Nudges</SectionTitle>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.7 }}>
        Based on current market conditions and detected behavioral signals, here are actionable nudges
        to help you make rational, long-term investment decisions.
      </p>

      {loading ? (
        <Spinner />
      ) : data ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Badge severity={data.severity} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Panic probability: <strong style={{ color: 'var(--text-primary)' }}>
                {(data.panic_probability * 100).toFixed(0)}%
              </strong>
            </span>
          </div>

          <div className="nudge-list">
            {data.nudges?.map((n, i) => <NudgeCard key={i} nudge={n} index={i} />)}
          </div>
        </>
      ) : null}

      {/* Behavioral biases education */}
      <SectionTitle icon="🧠" style={{ marginTop: 32 }}>Common Behavioral Biases</SectionTitle>
      <div className="chart-grid">
        {BEHAVIORAL_BIASES.map((b, i) => (
          <div key={i} className="stat-card" style={{
            borderLeft: `3px solid ${b.color}`,
          }}>
            <span className="icon" style={{ fontSize: '1.8rem' }}>{b.icon}</span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 8 }}>
              {b.name}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Commitment pledge */}
      <div style={{
        marginTop: 24,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,160,0.06))',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎯</div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>The Disciplined Investor's Pledge</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, maxWidth: 500, margin: '0 auto' }}>
          <em>"I will not let fear guide my financial decisions. I will stay invested through volatility,
          trust the power of compounding, and remember that every crash has been followed by a recovery."</em>
        </p>
      </div>
    </>
  );
}
