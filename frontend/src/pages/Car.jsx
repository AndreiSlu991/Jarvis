import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import TiltCard from '../components/ui/TiltCard.jsx';
import Counter from '../components/ui/Counter.jsx';
import Ring from '../components/ui/Ring.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';
import toast from 'react-hot-toast';

const DOC_TYPES = ['ITP', 'RCA', 'Rovinieta', 'CASCO', 'Vigneta'];
const TABS = ['Documente', 'Întreținere', 'Combustibil', 'Costuri', 'Asistent'];

function daysRemaining(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function ExpiryBadge({ days }) {
  const color = days < 0 ? '#f87171' : days <= 7 ? '#f87171' : days <= 14 ? '#fbbf24' : days <= 30 ? '#ffa047' : 'var(--dim)';
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, fontWeight: 600 }}>{days < 0 ? 'EXPIRAT' : `${days}z`}</span>;
}

function ChatPanel({ endpoint, systemHint }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const newMsgs = [...msgs, { role: 'user', content: input }];
    setMsgs(newMsgs); setInput(''); setLoading(true);
    try {
      const { data } = await api.post(endpoint, { messages: newMsgs });
      setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!msgs.length && (
          <p style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>{systemHint}</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.5,
              background: m.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: m.role === 'user' ? '#1a1208' : 'var(--ink)',
              borderBottomRightRadius: m.role === 'user' ? 4 : 14,
              borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
            }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: 'var(--faint)', fontSize: 13, padding: '0.5rem' }}>Se generează...</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="j-input" style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Întreabă ceva..." />
        <button className="j-btn j-btn-primary j-btn-sm" onClick={send} disabled={loading}>
          <JIcon name="send" size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Car() {
  const [tab, setTab] = useState(0);
  const qc = useQueryClient();
  const { data: info } = useGet('car-info', '/api/car/info');
  const { data: docs } = useGet('car-docs', '/api/car/documents');
  const { data: maintenance } = useGet('car-maintenance', '/api/car/maintenance');
  const { data: fuel } = useGet('car-fuel', '/api/car/fuel');
  const { data: fuelStats } = useGet('car-fuel-stats', '/api/car/fuel/stats');
  const { data: costs } = useGet('car-costs', '/api/car/costs');

  const [docForm, setDocForm] = useState({ type: 'ITP', expiry_date: '', reminder_days: 30, notes: '' });
  const [mForm, setMForm] = useState({ type: 'Schimb ulei', date: new Date().toISOString().slice(0,10), km: '', next_km: '', cost: '', description: '' });
  const [fForm, setFForm] = useState({ date: new Date().toISOString().slice(0,10), liters: '', price_per_liter: '', km_odometer: '', station: '', full_tank: 1 });
  const [infoForm, setInfoForm] = useState({ make: info?.make||'', model: info?.model||'', year: info?.year||'', fuel_type: info?.fuel_type||'benzina' });
  const [showDocForm, setShowDocForm] = useState(false);
  const [showMForm, setShowMForm] = useState(false);
  const [showFForm, setShowFForm] = useState(false);
  const [showInfoEdit, setShowInfoEdit] = useState(false);

  const saveDoc = useAction({ method: 'post', url: '/api/car/documents', invalidate: ['car-docs'] });
  const saveM = useAction({ method: 'post', url: '/api/car/maintenance', invalidate: ['car-maintenance', 'car-costs'] });
  const saveF = useAction({ method: 'post', url: '/api/car/fuel', invalidate: ['car-fuel', 'car-fuel-stats', 'car-costs'] });

  const carLabel = info?.make ? `${info.make} ${info.model} ${info.year}` : 'Mașina mea';

  const submitInfo = async (e) => {
    e.preventDefault();
    await api.put('/api/car/info', infoForm);
    qc.invalidateQueries({ queryKey: ['car-info'] });
    setShowInfoEdit(false);
    toast.success('Salvat');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#18140f', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ color: 'var(--faint)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(p.name === 'l/100km' ? 1 : 0)}</div>)}
      </div>
    );
  };

  return (
    <div className="j-screen j-screen-col">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>{carLabel}</h2>
          {info?.make && <p style={{ color: 'var(--faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{info.fuel_type} · {info.year}</p>}
        </div>
        <button className="j-btn j-btn-ghost j-btn-sm" onClick={() => { setInfoForm({ make: info?.make||'', model: info?.model||'', year: info?.year||'', fuel_type: info?.fuel_type||'benzina' }); setShowInfoEdit(true); }}>
          Editează
        </button>
      </div>

      {showInfoEdit && (
        <TiltCard className="j-card j-panel">
          <form onSubmit={submitInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Marcă', 'make'], ['Model', 'model'], ['An', 'year']].map(([l, k]) => (
              <div key={k} className="j-input-group">
                <label className="j-label">{l}</label>
                <input className="j-input" value={infoForm[k]} onChange={e => setInfoForm(f => ({...f, [k]: e.target.value}))} />
              </div>
            ))}
            <div className="j-input-group">
              <label className="j-label">Combustibil</label>
              <select className="j-input" value={infoForm.fuel_type} onChange={e => setInfoForm(f => ({...f, fuel_type: e.target.value}))}>
                {['benzina', 'motorina', 'hibrid', 'electric', 'gpl'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button className="j-btn j-btn-primary j-btn-sm" type="submit">Salvează</button>
              <button className="j-btn j-btn-ghost j-btn-sm" type="button" onClick={() => setShowInfoEdit(false)}>Anulează</button>
            </div>
          </form>
        </TiltCard>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={i === tab ? 'j-btn j-btn-primary j-btn-sm' : 'j-btn j-btn-ghost j-btn-sm'}>
            {t}
          </button>
        ))}
      </div>

      {/* ── DOCUMENTE ── */}
      {tab === 0 && (
        <div className="j-screen-col">
          <button className="j-btn j-btn-primary j-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowDocForm(s => !s)}>
            <JIcon name="plus" size={13} /> Adaugă document
          </button>
          {showDocForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={async e => { e.preventDefault(); await saveDoc.mutateAsync({ data: docForm }); setShowDocForm(false); }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="j-input-group">
                    <label className="j-label">Tip</label>
                    <select className="j-input" value={docForm.type} onChange={e => setDocForm(f => ({...f, type: e.target.value}))}>
                      {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="j-input-group">
                    <label className="j-label">Dată expirare</label>
                    <input className="j-input" type="date" required value={docForm.expiry_date} onChange={e => setDocForm(f => ({...f, expiry_date: e.target.value}))} />
                  </div>
                  <div className="j-input-group">
                    <label className="j-label">Reminder (zile înainte)</label>
                    <input className="j-input" type="number" value={docForm.reminder_days} onChange={e => setDocForm(f => ({...f, reminder_days: +e.target.value}))} />
                  </div>
                  <div className="j-input-group">
                    <label className="j-label">Note</label>
                    <input className="j-input" value={docForm.notes} onChange={e => setDocForm(f => ({...f, notes: e.target.value}))} />
                  </div>
                </div>
                <button className="j-btn j-btn-primary j-btn-sm" type="submit">Salvează</button>
              </form>
            </TiltCard>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(docs || []).map(d => {
              const days = daysRemaining(d.expiry_date);
              const urgent = days <= 30;
              return (
                <TiltCard key={d.id} className="j-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderColor: urgent && days <= 7 ? 'rgba(248,113,113,0.35)' : undefined }}>
                  <Ring value={Math.max(0, Math.min(days, 365))} max={365} size={52} stroke={4} color={days <= 7 ? '#f87171' : days <= 30 ? '#ffa047' : 'var(--accent)'}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>{Math.max(0, days)}</span>
                  </Ring>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 15 }}>{d.type}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>Expiră: {d.expiry_date}</div>
                    {d.notes && <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{d.notes}</div>}
                  </div>
                  <ExpiryBadge days={days} />
                  <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    onClick={async () => { await api.delete(`/api/car/documents/${d.id}`); qc.invalidateQueries({ queryKey: ['car-docs'] }); }}>×</button>
                </TiltCard>
              );
            })}
            {!docs?.length && <p style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>Niciun document adăugat.</p>}
          </div>
        </div>
      )}

      {/* ── ÎNTREȚINERE ── */}
      {tab === 1 && (
        <div className="j-screen-col">
          <button className="j-btn j-btn-primary j-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowMForm(s => !s)}>
            <JIcon name="plus" size={13} /> Adaugă intervenție
          </button>
          {showMForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={async e => { e.preventDefault(); await saveM.mutateAsync({ data: mForm }); setShowMForm(false); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Tip', 'type', 'text'], ['Data', 'date', 'date'],
                  ['Km curenți', 'km', 'number'], ['Km următor schimb', 'next_km', 'number'],
                  ['Cost (RON)', 'cost', 'number']
                ].map(([l, k, t]) => (
                  <div key={k} className="j-input-group">
                    <label className="j-label">{l}</label>
                    <input className="j-input" type={t} value={mForm[k]} onChange={e => setMForm(f => ({...f, [k]: e.target.value}))} required={k==='type'||k==='date'} />
                  </div>
                ))}
                <div className="j-input-group">
                  <label className="j-label">Descriere</label>
                  <input className="j-input" value={mForm.description} onChange={e => setMForm(f => ({...f, description: e.target.value}))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <button className="j-btn j-btn-primary j-btn-sm" type="submit">Salvează</button>
                </div>
              </form>
            </TiltCard>
          )}
          <div className="j-log">
            {(maintenance || []).map(m => (
              <TiltCard key={m.id} className="j-card j-log-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{m.type}</div>
                  {m.description && <div style={{ fontSize: 12, color: 'var(--dim)' }}>{m.description}</div>}
                  {m.next_km > 0 && <div style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>Următor: {m.next_km.toLocaleString()} km</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.km.toLocaleString()} km</div>
                  <div style={{ color: 'var(--faint)', fontSize: 11 }}>{m.date}</div>
                  {m.cost > 0 && <div style={{ color: 'var(--accent)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{m.cost} RON</div>}
                </div>
                <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={async () => { await api.delete(`/api/car/maintenance/${m.id}`); qc.invalidateQueries({ queryKey: ['car-maintenance'] }); }}>×</button>
              </TiltCard>
            ))}
            {!maintenance?.length && <p style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>Niciun service înregistrat.</p>}
          </div>
        </div>
      )}

      {/* ── COMBUSTIBIL ── */}
      {tab === 2 && (
        <div className="j-screen-col">
          <div className="j-metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>TOTAL CHELTUIELI</span></div>
              <div className="j-metric-num"><Counter value={fuelStats?.totalSpent || 0} decimals={0} /><small>RON</small></div>
            </TiltCard>
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>LITRI TOTAL</span></div>
              <div className="j-metric-num"><Counter value={fuelStats?.totalLiters || 0} decimals={1} /><small>L</small></div>
            </TiltCard>
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>CONSUM MEDIU</span></div>
              <div className="j-metric-num" style={{ fontSize: 28 }}>
                {fuelStats?.consumptions?.length
                  ? (fuelStats.consumptions.reduce((s, c) => s + c.l_100km, 0) / fuelStats.consumptions.length).toFixed(1)
                  : '—'
                }<small>L/100</small>
              </div>
            </TiltCard>
          </div>

          {fuelStats?.consumptions?.length > 1 && (
            <TiltCard className="j-card j-panel">
              <div className="j-sec-title">Evoluție consum</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={fuelStats.consumptions.slice(-20)}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--faint)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: 'var(--faint)', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="l_100km" name="l/100km" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TiltCard>
          )}

          <button className="j-btn j-btn-primary j-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowFForm(s => !s)}>
            <JIcon name="plus" size={13} /> Adaugă alimentare
          </button>
          {showFForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={async e => { e.preventDefault(); await saveF.mutateAsync({ data: { ...fForm, full_tank: fForm.full_tank ? 1 : 0 } }); setShowFForm(false); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Data', 'date', 'date'], ['Litri', 'liters', 'number'],
                  ['Preț/litru', 'price_per_liter', 'number'], ['Km bord', 'km_odometer', 'number'],
                  ['Stație', 'station', 'text']
                ].map(([l, k, t]) => (
                  <div key={k} className="j-input-group">
                    <label className="j-label">{l}</label>
                    <input className="j-input" type={t} step={t==='number'?'any':undefined} value={fForm[k]} onChange={e => setFForm(f => ({...f, [k]: e.target.value}))} required={['date','liters','price_per_liter','km_odometer'].includes(k)} />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="full_tank" checked={!!fForm.full_tank} onChange={e => setFForm(f => ({...f, full_tank: e.target.checked ? 1 : 0}))} />
                  <label htmlFor="full_tank" style={{ fontSize: 13, color: 'var(--dim)' }}>Plin complet</label>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <button className="j-btn j-btn-primary j-btn-sm" type="submit">Salvează</button>
                </div>
              </form>
            </TiltCard>
          )}

          <div className="j-log">
            {(fuel || []).slice(0, 20).map(f => (
              <TiltCard key={f.id} className="j-card j-log-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{f.liters} L {f.station && `— ${f.station}`}</div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>{f.km_odometer.toLocaleString()} km · {f.price_per_liter} RON/L {f.full_tank ? '· plin' : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{(f.liters * f.price_per_liter).toFixed(2)} RON</div>
                  <div style={{ color: 'var(--faint)', fontSize: 11 }}>{f.date}</div>
                </div>
                <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={async () => { await api.delete(`/api/car/fuel/${f.id}`); qc.invalidateQueries({ queryKey: ['car-fuel', 'car-fuel-stats'] }); }}>×</button>
              </TiltCard>
            ))}
          </div>
        </div>
      )}

      {/* ── COSTURI ── */}
      {tab === 3 && (
        <div className="j-screen-col">
          <div className="j-metrics">
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>TOTAL AN</span></div>
              <div className="j-metric-num"><Counter value={costs?.total || 0} /><small>RON</small></div>
            </TiltCard>
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>COMBUSTIBIL</span></div>
              <div className="j-metric-num"><Counter value={costs?.fuel || 0} /><small>RON</small></div>
            </TiltCard>
            <TiltCard className="j-card j-metric">
              <div className="j-metric-label"><span>SERVICE</span></div>
              <div className="j-metric-num"><Counter value={costs?.maintenance || 0} /><small>RON</small></div>
            </TiltCard>
          </div>
          {costs?.monthly?.length > 0 && (
            <TiltCard className="j-card j-panel">
              <div className="j-sec-title">Costuri lunare {costs.year}</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(
                  (costs.monthly || []).reduce((acc, r) => {
                    if (!acc[r.month]) acc[r.month] = { month: r.month, fuel: 0, maintenance: 0 };
                    acc[r.month].fuel += r.fuel;
                    acc[r.month].maintenance += r.maintenance;
                    return acc;
                  }, {})
                ).map(([, v]) => v)}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--faint)', fontSize: 10 }} tickFormatter={m => m.slice(5)} />
                  <YAxis tick={{ fill: 'var(--faint)', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fuel" name="Combustibil" stackId="a" fill="var(--accent)" radius={[0,0,0,0]} />
                  <Bar dataKey="maintenance" name="Service" stackId="a" fill="#7fc8ff" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </TiltCard>
          )}
        </div>
      )}

      {/* ── ASISTENT ── */}
      {tab === 4 && (
        <TiltCard className="j-card j-panel">
          <div className="j-sec-title" style={{ marginBottom: 16 }}>
            <JIcon name="work" size={12} /> Asistent Auto
          </div>
          <ChatPanel endpoint="/api/car/chat" systemHint={`Asistentul tău auto pentru ${carLabel}. Întreabă orice despre mașina ta.`} />
        </TiltCard>
      )}
    </div>
  );
}
