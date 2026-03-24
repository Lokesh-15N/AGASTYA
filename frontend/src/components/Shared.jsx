// Shared helper components

export function Spinner() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}

export function Badge({ severity }) {
  const map = {
    NORMAL:   'badge-normal',
    MODERATE: 'badge-moderate',
    HIGH:     'badge-panic',
    EXTREME:  'badge-extreme',
  };
  return (
    <span className={`badge ${map[severity] || 'badge-normal'}`}>
      <span className="badge-dot" />
      {severity}
    </span>
  );
}

export function Fmt({ value, prefix = '₹', decimals = 0 }) {
  const n = Number(value);
  if (isNaN(n)) return '–';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const fmt = abs >= 1e7
    ? `${sign}${prefix}${(abs / 1e7).toFixed(2)} Cr`
    : abs >= 1e5
    ? `${sign}${prefix}${(abs / 1e5).toFixed(2)} L`
    : `${sign}${prefix}${abs.toFixed(decimals)}`;
  return fmt;
}

export function PctChange({ value }) {
  const n = Number(value);
  if (isNaN(n)) return null;
  const cls = n >= 0 ? 'up' : 'down';
  return <span className={`delta ${cls}`}>{n >= 0 ? '▲' : '▼'} {Math.abs(n).toFixed(2)}%</span>;
}

export function SectionTitle({ icon, children }) {
  return (
    <h2 className="section-title">
      {icon && <span>{icon}</span>}
      {children}
    </h2>
  );
}
