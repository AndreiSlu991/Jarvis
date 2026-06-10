import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from '../components/ui/TiltCard.jsx';
import Counter from '../components/ui/Counter.jsx';
import Ring from '../components/ui/Ring.jsx';
import TypeLines from '../components/ui/TypeLines.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import { useGet, useAction } from '../hooks/useApi';

function briefLines(content) {
  if (!content) return [];
  return content
    .split(/\n+/)
    .map(l => l.replace(/^#{1,3}\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: briefing, isLoading: briefLoading } = useGet('briefing', '/api/briefing/today');
  const { data: streaks } = useGet('streaks', '/api/habits/streaks');
  const { data: budget } = useGet('budget-summary', '/api/budget/summary?months=1');
  const { data: fitness } = useGet('fitness-today', '/api/fitness/today');
  const { data: nextExpiry } = useGet('car-next-expiry', '/api/car/next-expiry');
  const { data: blajeniTopics } = useGet('blajeni-topics', '/api/blajeni2/topics');
  const { data: blajeniShopping } = useGet('blajeni-shopping', '/api/blajeni2/shopping');
  const { mutate: regen, isLoading: regening } = useAction({ method: 'post', url: '/api/briefing/generate', invalidate: ['briefing'] });

  const lines = briefLines(briefing?.content);
  const topStreak = streaks ? Math.max(...Object.values(streaks).map(s => s.current || 0), 0) : 0;
  const monthSpend = budget?.categories ? Object.values(budget.categories).reduce((a, c) => a + (c.total || 0), 0) : 0;
  const hrv = fitness?.hrv || 0;
  const activeTopics = (blajeniTopics || []).filter(t => t.status !== 'done').length;
  const pendingItems = (blajeniShopping || []).reduce((s, l) => s + (l.items || []).filter(i => !i.bought).length, 0);
  const expiryUrgent = nextExpiry && nextExpiry.days_remaining <= 30;

  return (
    <div className="j-screen j-screen-col">
      {/* Hero briefing */}
      <TiltCard className="j-card j-hero">
        <div className="j-hero-head">
          <span className="j-eyebrow">
            <JIcon name="sun" size={13} />
            {new Date().toLocaleDateString('en', { weekday:'long', month:'long', day:'numeric' })}
          </span>
          <button
            className="j-ghost-btn"
            onClick={() => regen()}
            title="Regenerate briefing"
            style={{ opacity: regening ? 0.5 : 1 }}
          >
            <JIcon name="send" size={15} />
          </button>
        </div>
        <div className="j-brief-lines">
          {briefLoading ? (
            <>
              {[1,2,3].map(i => (
                <div key={i} className="j-skel" style={{ height: i===1?28:18, width: i===1?'80%':'65%' }} />
              ))}
            </>
          ) : lines.length ? (
            <TypeLines lines={lines} />
          ) : (
            <p style={{ color: 'var(--dim)', fontSize: 15 }}>
              No briefing yet —{' '}
              <button style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => regen()}>
                generate one
              </button>
            </p>
          )}
        </div>
      </TiltCard>

      {/* Metrics row */}
      <div className="j-metrics">
        <TiltCard className="j-card j-metric">
          <div className="j-metric-label">
            <span>TOP STREAK</span>
            <JIcon name="habits" size={13} />
          </div>
          <div className="j-metric-num xl" style={{ color: 'var(--accent)' }}>
            <Counter value={topStreak} /><small>days</small>
          </div>
          <div className="j-metric-sub">Best current habit streak</div>
          <div className="j-meter"><span style={{ width: `${Math.min(topStreak / 30 * 100, 100)}%` }} /></div>
        </TiltCard>

        <TiltCard className="j-card j-metric">
          <div className="j-metric-label">
            <span>MONTHLY SPEND</span>
            <JIcon name="budget" size={13} />
          </div>
          <div className="j-metric-num">
            <Counter value={monthSpend} /><small>RON</small>
          </div>
          <div className="j-metric-sub">This month expenses</div>
          <div className="j-meter"><span style={{ width: `${Math.min(monthSpend / 5000 * 100, 100)}%` }} /></div>
        </TiltCard>

        <TiltCard className="j-card j-metric">
          <div className="j-metric-label">
            <span>HRV</span>
            <JIcon name="fitness" size={13} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Ring value={hrv} max={100} size={56} stroke={4}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{hrv || '—'}</span>
            </Ring>
            <div>
              <div className="j-metric-num" style={{ fontSize: 32 }}><Counter value={hrv} /></div>
              <div className="j-metric-sub">Heart rate variability</div>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="j-card j-metric">
          <div className="j-metric-label">
            <span>TODAY</span>
            <JIcon name="home" size={13} />
          </div>
          <div className="j-metric-num" style={{ fontSize: 28, marginTop: 4 }}>
            {new Date().toLocaleDateString('en', { day: 'numeric', month: 'short' })}
          </div>
          <div className="j-metric-sub" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>
            {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </TiltCard>
      </div>

      {/* Widget row — Car + Blajeni */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Car expiry widget */}
        <TiltCard className="j-card j-metric" onClick={() => navigate('/car')} style={{ cursor: 'pointer' }}>
          <div className="j-metric-label">
            <span>MAȘINA</span>
            <JIcon name="car" size={13} />
          </div>
          {nextExpiry ? (
            <>
              <div className="j-metric-num" style={{ fontSize: 28, color: expiryUrgent ? (nextExpiry.days_remaining <= 7 ? '#f87171' : '#ffa047') : 'var(--ink)' }}>
                <Counter value={nextExpiry.days_remaining} /><small>zile</small>
              </div>
              <div className="j-metric-sub">{nextExpiry.type} · expiră {nextExpiry.expiry_date}</div>
              {expiryUrgent && (
                <div className="j-meter tall"><span style={{ width: `${Math.max(5, nextExpiry.days_remaining / 30 * 100)}%`, background: nextExpiry.days_remaining <= 7 ? '#f87171' : 'var(--accent)' }} /></div>
              )}
            </>
          ) : (
            <div className="j-metric-sub" style={{ marginTop: 8 }}>Niciun document adăugat</div>
          )}
        </TiltCard>

        {/* Blajeni widget */}
        <TiltCard className="j-card j-metric" onClick={() => navigate('/blajeni')} style={{ cursor: 'pointer' }}>
          <div className="j-metric-label">
            <span>BLAJENI</span>
            <JIcon name="blajeni" size={13} />
          </div>
          <div className="j-metric-num" style={{ fontSize: 32 }}>
            <Counter value={activeTopics} /><small>proiecte</small>
          </div>
          <div className="j-metric-sub">{pendingItems} produse de cumpărat</div>
          <div className="j-meter"><span style={{ width: `${Math.min(activeTopics / 5 * 100, 100)}%` }} /></div>
        </TiltCard>
      </div>
    </div>
  );
}
