import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 16px', alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)',
          animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
        }}/>
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14,
      gap: 10,
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>🐑</div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg, var(--accent), #7c3aed)'
          : 'var(--bg-card2)',
        border: isUser ? 'none' : '1px solid var(--border)',
        fontSize: '0.875rem',
        lineHeight: 1.7,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        boxShadow: isUser ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
      }}>
        {msg.parts}
      </div>
      {isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>👤</div>
      )}
    </div>
  );
}

const INTRO_MSG = {
  role: 'model',
  parts: `👋 Hey! I'm **SheepOrSleep AI** – your behavioral finance companion.

I can help you with:
• 📉 Understanding the **Panic Tax** and what it costs you
• 🐑 Explaining **herd behavior** in markets
• 💡 Smart vs disciplined vs panic investing
• 🧠 Behavioral biases: loss aversion, recency bias & more
• 📊 Interpreting charts & data on this platform

**I'm strictly focused on behavioral finance & mutual fund investing.** Ask me anything!`
};

export default function Chatbot() {
  const [messages,    setMessages]    = useState([INTRO_MSG]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [starters,    setStarters]    = useState([]);
  const [error,       setError]       = useState('');
  const bottomRef = useRef(null);
  const textRef   = useRef(null);

  useEffect(() => {
    axios.get(`${API}/chat/starters`).then(r => setStarters(r.data.questions)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', parts: msg };
    const history = messages.filter(m => m !== INTRO_MSG);   // exclude intro from API history
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chat`, {
        history: history.map(m => ({ role: m.role, parts: m.parts })),
        message: msg,
      });
      setMessages(prev => [...prev, { role: 'model', parts: res.data.reply }]);
    } catch (e) {
      const errText = e.response?.data?.detail || '⚠️ I had trouble connecting. Please make sure the backend server is running on port 8000.';
      setError('Failed to get response.');
      setMessages(prev => [...prev, {
        role: 'model',
        parts: errText.includes('429')
          ? '⚠️ **Rate Limit Reached**: Your Gemini API Key has exceeded its free tier quota. Please wait a minute or use a newly generated key.'
          : errText,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => setMessages([INTRO_MSG]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxHeight: 800 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,160,0.06))',
        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 0 20px rgba(99,102,241,0.4)',
        }}>🐑</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.05rem' }}>
            SheepOrSleep AI
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
            Powered by Gemini · Behavioral Finance Expert
          </div>
        </div>
        <button onClick={clearChat} style={{
          marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: 8, padding: '6px 14px',
          cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit',
        }}>
          Clear chat
        </button>
      </div>

      {/* Starter questions – show only if at beginning */}
      {messages.length === 1 && starters.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Suggested questions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {starters.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', borderRadius: 99, padding: '7px 14px',
                cursor: 'pointer', fontSize: '0.76rem', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 4px 8px',
        scrollbarWidth: 'thin',
      }}>
        {messages.map((m, i) => <Message key={i} msg={m}/>)}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>🐑</div>
            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px' }}>
              <TypingDots/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 12,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '8px 8px 8px 16px',
        boxShadow: '0 0 0 0 transparent', transition: 'box-shadow 0.2s',
      }}>
        <textarea
          ref={textRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about panic selling, herd behavior, or your portfolio strategy…"
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem',
            resize: 'none', lineHeight: 1.6, paddingTop: 4,
            scrollbarWidth: 'thin',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: (!input.trim() || loading) ? 'var(--bg-card2)' : 'var(--accent)',
            border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
            color: (!input.trim() || loading) ? 'var(--text-muted)' : '#fff',
            fontSize: '1.1rem', transition: 'all 0.2s',
            boxShadow: (!input.trim() || loading) ? 'none' : '0 0 12px var(--accent-glow)',
          }}
        >
          {loading ? '⏳' : '↑'}
        </button>
      </div>

      <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        SheepOrSleep AI is strictly limited to behavioral finance & mutual fund education.
        Not SEBI-registered financial advice.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
