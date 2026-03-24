import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { SectionTitle } from './Shared';

export default function LiveTicker() {
  const [data, setData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [panicAlert, setPanicAlert] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    let ws;
    let keepAlive;

    // Simulate real-world 1s delay before starting WS to show connection handling
    const timer = setTimeout(() => {
      ws = new WebSocket('ws://localhost:8000/live-ticker');

      ws.onopen = () => {
        setStatus('Connected (Live HFT Server)');
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const timeStr = payload.timestamp.split('T')[1].substring(0, 8);

        setCurrentPrice(payload.price);

        if (payload.is_panic) {
          setPanicAlert(true);
          // Auto dismiss alert
          setTimeout(() => setPanicAlert(false), 3000);
        }

        setData(prev => {
          const newData = [...prev, { time: timeStr, price: payload.price, is_panic: payload.is_panic }];
          // Keep last 60 seconds
          if (newData.length > 60) newData.shift();
          return newData;
        });
      };

      ws.onerror = () => {
        setStatus('Error: Websocket connection lost.');
      };

      ws.onclose = () => {
        setStatus('Disconnected.');
      };
    }, 500);

    return () => {
      clearTimeout(timer);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <SectionTitle title="Live Equities Ticker (HFT Demo)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: status.includes('Connected') ? 'var(--green)' : 'var(--red)',
            boxShadow: status.includes('Connected') ? '0 0 10px var(--green)' : 'none',
            animation: status.includes('Connected') ? 'pulse 1.5s infinite' : 'none'
          }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{status}</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        This module simulates a high-frequency trading (HFT) WebSocket connection to a brokerage (e.g., Zerodha Kite Connect). It instantly pushes real-time tick data. Observe what happens when our algorithm detects a "Micro-Panic Flash Crash" in real time!
      </p>

      {/* Giant Live Price Indicator */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        padding: '24px 32px', borderRadius: 'var(--radius)', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Core Engine Target Asset</h4>
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>NIFTY 50 (Simulation)</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Live Spot Price</h4>
          <span style={{
            fontSize: '3rem', fontWeight: 800,
            color: panicAlert ? 'var(--red)' : '#fff',
            transition: 'color 0.3s'
          }}>
            ₹{currentPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Flashing Smart Nudge Alert */}
      {panicAlert && (
         <div style={{
           background: 'rgba(244, 63, 94, 0.1)', border: '2px solid var(--red)',
           color: '#fff', padding: '16px 24px', borderRadius: 'var(--radius)',
           marginBottom: 24, animation: 'pulse 1s infinite',
           display: 'flex', alignItems: 'flex-start', gap: 16
         }}>
           <div style={{ fontSize: '2rem' }}>🚨</div>
           <div>
             <h3 style={{ margin: '0 0 8px 0', color: 'var(--red)' }}>ALGORITHMIC ALERT: FLASH CRASH DETECTED</h3>
             <p style={{ margin: 0, opacity: 0.9 }}>
               Our ML model just detected a massive downward volatility spike (Micro-Panic). <b>DO NOT PANIC SELL.</b> Institutional algorithms create these drops to steal liquidity from retail investors. Hold your position!
             </p>
           </div>
         </div>
      )}

      {/* Live Chart Canvas */}
      <div style={{ height: 400, background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
        {data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Awaiting WebSocket Tick...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} minTickGap={30} />
              <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} width={60} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: 8 }}
                itemStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={panicAlert ? "var(--red)" : "var(--accent)"}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false} // Turn off so it ticks instantly
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Required for the pulse animation if not already existing globally */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
      `}</style>
    </div>
  );
}
