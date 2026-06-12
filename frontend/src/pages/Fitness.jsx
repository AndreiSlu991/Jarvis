import { useState } from 'react';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import Ring from '../components/ui/Ring.jsx';
import Bars from '../components/ui/Bars.jsx';
import { useGet, useAction } from '../hooks/useApi';

const KIND_KEYS = ['strength', 'cardio', 'recovery', 'morning', 'metrics'];

function sessionKind(type) {
  const t = (type ?? '').toLowerCase();
  for (const k of KIND_KEYS) {
    if (t.includes(k)) return k;
  }
  return 'strength';
}

export default function Fitness() {
  const today = useGet(['fitness-today'], '/fitness/today');
  const sessions = useGet(['fitness-sessions'], '/fitness/sessions?limit=10');
  const advice = useAction({ method: 'get', url: '/fitness/advice' });
  const logSession = useAction({
    url: '/fitness/sessions',
    invalidate: [['fitness-sessions'], ['fitness-today']],
    successMessage: 'Session logged',
  });

  const [adviceData, setAdviceData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'strength', duration_min: 30, notes: '' });

  const t = today.data;
  const hrv = t?.hrv ?? 0;
  const sleep = t?.sleep_score ?? 0;
  const recent = sessions.data ?? [];

  const barsData = recent
    .slice()
    .reverse()
    .map((s) => ({ value: s.hrv ?? 0, label: s.date?.slice(5) ?? '' }));

  return (
    <div className="j-screen-col">
      {/* today metrics */}
      <div className="j-split" style={{ gap: 12 }}>
        <TiltCard className="j-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="j-eyebrow">HRV</div>
          <Ring value={hrv} max={100} label={hrv ? `${hrv}` : '—'} />
          <div className="j-ring-label">Heart Rate Variability</div>
        </TiltCard>
        <TiltCard className="j-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="j-eyebrow">Sleep</div>
          <Ring value={sleep} max={100} label={sleep ? `${sleep}` : '—'} />
          <div className="j-ring-label">Sleep Score</div>
        </TiltCard>
        <TiltCard className="j-card" style={{ flex: 1 }}>
          <div className="j-eyebrow">Readiness</div>
          <div className="j-metrics" style={{ marginTop: 8 }}>
            {t?.resting_hr && (
              <div className="j-metric">
                <div className="j-metric-label">Resting HR</div>
                <div className="j-metric-num">{t.resting_hr}</div>
                <div className="j-metric-sub">bpm</div>
              </div>
            )}
            {t?.steps && (
              <div className="j-metric">
                <div className="j-metric-label">Steps</div>
                <div className="j-metric-num">{t.steps.toLocaleString()}</div>
                <div className="j-metric-sub">today</div>
              </div>
            )}
            {!t?.resting_hr && !t?.steps && (
              <p style={{ color: 'var(--fg-muted)', fontSize: 13 }}>No data synced yet.</p>
            )}
          </div>
        </TiltCard>
      </div>

      {/* HRV bars */}
      {barsData.length > 0 && (
        <div className="j-card">
          <div className="j-sec-title">HRV trend</div>
          <Bars data={barsData} style={{ marginTop: 12 }} />
        </div>
      )}

      {/* AI advice */}
      <div className="j-card">
        <div className="j-row-head">
          <div className="j-sec-title">AI Workout Advice</div>
          <button
            className="j-btn j-btn-ghost j-btn-sm"
            onClick={async () => setAdviceData(await advice.mutateAsync({}))}
            disabled={advice.isPending}
          >
            <JIcon name="sparkles" /> {advice.isPending ? 'Thinking…' : 'Get advice'}
          </button>
        </div>
        {adviceData ? (
          <div style={{ marginTop: 12 }}>
            {adviceData.intensity && (
              <span
                className="j-badge"
                style={{
                  background:
                    adviceData.intensity === 'high'
                      ? 'rgba(239,68,68,.15)'
                      : adviceData.intensity === 'low'
                      ? 'rgba(34,197,94,.15)'
                      : 'rgba(234,179,8,.15)',
                  color:
                    adviceData.intensity === 'high'
                      ? 'var(--red)'
                      : adviceData.intensity === 'low'
                      ? 'var(--green)'
                      : '#facc15',
                  marginBottom: 8,
                  display: 'inline-block',
                }}
              >
                {adviceData.intensity} intensity
              </span>
            )}
            {adviceData.rationale && (
              <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 10 }}>{adviceData.rationale}</p>
            )}
            {(adviceData.exercises ?? []).map((ex, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-raised)', borderRadius: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{ex.sets}×{ex.reps} · {ex.equipment}</span>
              </div>
            ))}
          </div>
        ) : (
          !advice.isPending && (
            <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 8 }}>
              Tap "Get advice" for a Claude-generated workout adapted to your recent HRV and sleep.
            </p>
          )
        )}
      </div>

      {/* recent sessions */}
      <div className="j-card">
        <div className="j-row-head">
          <div className="j-sec-title">Recent Sessions</div>
          <button className="j-btn j-btn-primary j-btn-sm" onClick={() => setShowForm((v) => !v)}>
            <JIcon name="plus" /> Log
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await logSession.mutateAsync({ data: { ...form, duration_min: parseInt(form.duration_min, 10) } });
              setShowForm(false);
              setForm({ type: 'strength', duration_min: 30, notes: '' });
            }}
            style={{ margin: '12px 0', padding: '12px', background: 'var(--surface-raised)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div className="j-input-group">
              <label className="j-label">Type</label>
              <select className="j-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {KIND_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="j-input-group">
              <label className="j-label">Duration (min)</label>
              <input className="j-input" type="number" value={form.duration_min}
                onChange={(e) => setForm({ ...form, duration_min: e.target.value })} required />
            </div>
            <div className="j-input-group">
              <label className="j-label">Notes</label>
              <input className="j-input" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="j-btn j-btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="j-btn j-btn-primary" style={{ flex: 1 }} disabled={logSession.isPending}>
                {logSession.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {sessions.isLoading ? (
          <div className="j-skel" style={{ height: 180, marginTop: 12 }} />
        ) : recent.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '24px 0', fontSize: 14 }}>No sessions yet.</p>
        ) : (
          <ul className="j-log" style={{ marginTop: 8 }}>
            {recent.map((s) => (
              <li key={s.id} className={`j-log-row j-kind ${sessionKind(s.type)}`}>
                <span className="j-log-num">{s.duration_min ?? s.duration ?? '—'}<small>min</small></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{s.type}</div>
                  {s.notes && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{s.notes}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span className="j-log-date">{s.date}</span>
                  {s.hrv != null && (
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>HRV {s.hrv}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
