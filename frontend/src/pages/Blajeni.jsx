import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';
import toast from 'react-hot-toast';

const TABS = ['Proiecte', 'Cumpărături', 'Scule', 'Asistent'];
const SHOP_CATS = ['materiale constructie', 'electrice', 'sanitare', 'gradina', 'diverse'];
const TOOL_CATS = ['general', 'electric', 'manual', 'masurare', 'gradina', 'siguranta'];
const TOPIC_STATUSES = ['planned', 'in-progress', 'done'];

function ChatPanel({ endpoint, context, placeholder }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const newMsgs = [...msgs, { role: 'user', content: input }];
    setMsgs(newMsgs); setInput(''); setLoading(true);
    try {
      const { data } = await api.post(endpoint, { messages: newMsgs, tool_context: context });
      setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!msgs.length && <p style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>{placeholder}</p>}
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
        {loading && <div style={{ color: 'var(--faint)', fontSize: 13 }}>Se generează...</div>}
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

export default function Blajeni() {
  const [tab, setTab] = useState(0);
  const qc = useQueryClient();

  // Topics
  const { data: topics, isLoading: topicsLoading } = useGet('blajeni-topics', '/api/blajeni2/topics');
  const [topicForm, setTopicForm] = useState({ title: '', status: 'planned', notes: '' });
  const [showTopicForm, setShowTopicForm] = useState(false);
  const saveTopicAction = useAction({ method: 'post', url: '/api/blajeni2/topics', invalidate: ['blajeni-topics'] });

  // Shopping
  const { data: shopping } = useGet('blajeni-shopping', '/api/blajeni2/shopping');
  const [showListForm, setShowListForm] = useState(false);
  const [listForm, setListForm] = useState({ name: '', category: 'diverse' });
  const [activeList, setActiveList] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unit: 'buc', estimated_price: '', store_suggestion: '' });
  const [showItemForm, setShowItemForm] = useState(false);

  // Tools
  const { data: tools } = useGet('blajeni-tools', '/api/blajeni2/tools');
  const [showToolForm, setShowToolForm] = useState(false);
  const [toolForm, setToolForm] = useState({ name: '', brand: '', model: '', category: 'general', purchase_date: '', purchase_price: '', store: '', condition: 'good' });
  const [addingTool, setAddingTool] = useState(false);
  const [toolChat, setToolChat] = useState(null);

  const submitTopic = async (e) => {
    e.preventDefault();
    await saveTopicAction.mutateAsync({ data: topicForm });
    setTopicForm({ title: '', status: 'planned', notes: '' });
    setShowTopicForm(false);
  };

  const updateTopicStatus = async (id, status) => {
    await api.put(`/api/blajeni2/topics/${id}`, { status });
    qc.invalidateQueries({ queryKey: ['blajeni-topics'] });
  };

  const deleteTopic = async (id) => {
    await api.delete(`/api/blajeni2/topics/${id}`);
    qc.invalidateQueries({ queryKey: ['blajeni-topics'] });
  };

  const createList = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/api/blajeni2/shopping', listForm);
    qc.invalidateQueries({ queryKey: ['blajeni-shopping'] });
    setActiveList(data.id);
    setListForm({ name: '', category: 'diverse' });
    setShowListForm(false);
  };

  const addItem = async (e) => {
    e.preventDefault();
    await api.post(`/api/blajeni2/shopping/${activeList}/items`, itemForm);
    qc.invalidateQueries({ queryKey: ['blajeni-shopping'] });
    setItemForm({ name: '', quantity: 1, unit: 'buc', estimated_price: '', store_suggestion: '' });
    setShowItemForm(false);
  };

  const toggleBought = async (itemId, bought) => {
    await api.put(`/api/blajeni2/shopping/items/${itemId}`, { bought: bought ? 0 : 1 });
    qc.invalidateQueries({ queryKey: ['blajeni-shopping'] });
  };

  const deleteItem = async (itemId) => {
    await api.delete(`/api/blajeni2/shopping/items/${itemId}`);
    qc.invalidateQueries({ queryKey: ['blajeni-shopping'] });
  };

  const submitTool = async (e) => {
    e.preventDefault();
    setAddingTool(true);
    try {
      await api.post('/api/blajeni2/tools', toolForm);
      qc.invalidateQueries({ queryKey: ['blajeni-tools'] });
      setToolForm({ name: '', brand: '', model: '', category: 'general', purchase_date: '', purchase_price: '', store: '', condition: 'good' });
      setShowToolForm(false);
      toast.success('Sculă adăugată. Se caută manual...');
    } catch (err) { toast.error(err.message); }
    finally { setAddingTool(false); }
  };

  const activeShopping = (shopping || []).find(l => l.id === activeList) || shopping?.[0];
  const listTotal = (activeShopping?.items || []).reduce((s, i) => s + (i.estimated_price || 0) * (i.quantity || 1), 0);
  const grandTotal = (shopping || []).reduce((s, l) => s + (l.items || []).reduce((ss, i) => ss + (i.estimated_price || 0) * (i.quantity || 1), 0), 0);

  const statusColors = { planned: 'var(--faint)', 'in-progress': 'var(--accent)', done: '#9fdfb2' };
  const statusLabels = { planned: 'Planificat', 'in-progress': 'În lucru', done: 'Finalizat' };

  return (
    <div className="j-screen j-screen-col">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={i === tab ? 'j-btn j-btn-primary j-btn-sm' : 'j-btn j-btn-ghost j-btn-sm'}>
            {t}
          </button>
        ))}
      </div>

      {/* ── PROIECTE ── */}
      {tab === 0 && (
        <div className="j-screen-col">
          <button className="j-btn j-btn-primary j-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowTopicForm(s => !s)}>
            <JIcon name="plus" size={13} /> Proiect nou
          </button>
          {showTopicForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={submitTopic} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="j-input-group" style={{ gridColumn: '1/-1' }}>
                    <label className="j-label">Titlu proiect</label>
                    <input className="j-input" required value={topicForm.title} onChange={e => setTopicForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Acoperiș, Instalație electrică" />
                  </div>
                  <div className="j-input-group">
                    <label className="j-label">Status</label>
                    <select className="j-input" value={topicForm.status} onChange={e => setTopicForm(f => ({...f, status: e.target.value}))}>
                      {TOPIC_STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                    </select>
                  </div>
                  <div className="j-input-group">
                    <label className="j-label">Note</label>
                    <input className="j-input" value={topicForm.notes} onChange={e => setTopicForm(f => ({...f, notes: e.target.value}))} />
                  </div>
                </div>
                <button className="j-btn j-btn-primary j-btn-sm" type="submit">Salvează</button>
              </form>
            </TiltCard>
          )}
          <div className="j-notes-grid">
            {topicsLoading && [1,2,3].map(i => <div key={i} className="j-skel" style={{ height: 120 }} />)}
            {(topics || []).map(t => (
              <TiltCard key={t.id} className="j-card j-note">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 500 }}>{t.title}</h3>
                  <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => deleteTopic(t.id)}>×</button>
                </div>
                {t.notes && <p style={{ fontSize: 13, color: 'var(--dim)', flex: 1 }}>{t.notes}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {TOPIC_STATUSES.map(s => (
                    <button key={s} onClick={() => updateTopicStatus(t.id, s)}
                      style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, border: '1px solid', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', cursor: 'pointer', background: 'none',
                        borderColor: t.status === s ? statusColors[s] : 'var(--line)',
                        color: t.status === s ? statusColors[s] : 'var(--faint)',
                      }}>
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
                <span className="j-note-date">{t.created_at?.slice(0,10)}</span>
              </TiltCard>
            ))}
            <button className="j-note-add j-card" onClick={() => setShowTopicForm(true)} style={{ minHeight: 120, border: 'none', cursor: 'pointer' }}>
              <JIcon name="plus" size={22} style={{ color: 'var(--faint)' }} />
              <span>Adaugă proiect</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CUMPĂRĂTURI ── */}
      {tab === 1 && (
        <div className="j-screen-col">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(shopping || []).map(l => (
              <button key={l.id} onClick={() => setActiveList(l.id)}
                style={{ padding: '5px 14px', borderRadius: 100, fontSize: 13, cursor: 'pointer', background: 'none',
                  border: '1px solid',
                  borderColor: activeShopping?.id === l.id ? 'var(--accent)' : 'var(--line)',
                  color: activeShopping?.id === l.id ? 'var(--accent)' : 'var(--dim)',
                }}>
                {l.name} <span style={{ color: 'var(--faint)', fontSize: 11 }}>({(l.items||[]).length})</span>
              </button>
            ))}
            <button className="j-btn j-btn-ghost j-btn-sm" onClick={() => setShowListForm(s => !s)}>
              <JIcon name="plus" size={13} /> Listă nouă
            </button>
          </div>

          {showListForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={createList} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="j-input-group" style={{ flex: 2 }}>
                  <label className="j-label">Nume listă</label>
                  <input className="j-input" required value={listForm.name} onChange={e => setListForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Materiale acoperis" />
                </div>
                <div className="j-input-group" style={{ flex: 1 }}>
                  <label className="j-label">Categorie</label>
                  <select className="j-input" value={listForm.category} onChange={e => setListForm(f => ({...f, category: e.target.value}))}>
                    {SHOP_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button className="j-btn j-btn-primary j-btn-sm" type="submit">Crează</button>
              </form>
            </TiltCard>
          )}

          {activeShopping && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 500 }}>{activeShopping.name}</h3>
                  <p style={{ color: 'var(--faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    Total: <span style={{ color: 'var(--accent)' }}>{listTotal.toFixed(0)} RON</span>
                    {shopping.length > 1 && <> · Grand total: {grandTotal.toFixed(0)} RON</>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="j-btn j-btn-ghost j-btn-sm" onClick={() => setShowItemForm(s => !s)}>
                    <JIcon name="plus" size={13} /> Adaugă
                  </button>
                  <button className="j-btn j-btn-ghost j-btn-sm" style={{ color: 'var(--faint)' }}
                    onClick={async () => { await api.delete(`/api/blajeni2/shopping/${activeShopping.id}`); qc.invalidateQueries({ queryKey: ['blajeni-shopping'] }); setActiveList(null); }}>
                    Șterge lista
                  </button>
                </div>
              </div>

              {showItemForm && (
                <TiltCard className="j-card j-panel">
                  <form onSubmit={addItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    <div className="j-input-group" style={{ gridColumn: '1/-1' }}>
                      <label className="j-label">Produs</label>
                      <input className="j-input" required value={itemForm.name} onChange={e => setItemForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Tigla ceramica" />
                    </div>
                    {[['Cantitate', 'quantity', 'number'], ['Unitate', 'unit', 'text'], ['Preț estimat RON', 'estimated_price', 'number']].map(([l, k, t]) => (
                      <div key={k} className="j-input-group">
                        <label className="j-label">{l}</label>
                        <input className="j-input" type={t} step={t==='number'?'any':undefined} value={itemForm[k]} onChange={e => setItemForm(f => ({...f, [k]: e.target.value}))} />
                      </div>
                    ))}
                    <div className="j-input-group" style={{ gridColumn: '1/-1' }}>
                      <label className="j-label">Magazin sugerat</label>
                      <input className="j-input" value={itemForm.store_suggestion} onChange={e => setItemForm(f => ({...f, store_suggestion: e.target.value}))} placeholder="e.g. Dedeman, Leroy Merlin" />
                    </div>
                    <button className="j-btn j-btn-primary j-btn-sm" type="submit">Adaugă</button>
                  </form>
                </TiltCard>
              )}

              <div className="j-checklist">
                {(activeShopping.items || []).map(item => (
                  <div key={item.id} className={`j-checkitem${item.bought ? ' done' : ''}`}
                    onClick={() => toggleBought(item.id, item.bought)}>
                    <span className="j-checkbox">
                      {item.bought ? <JIcon name="check" size={11} /> : null}
                    </span>
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>{item.quantity} {item.unit}</span>
                    {item.estimated_price > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{(item.estimated_price * item.quantity).toFixed(0)} RON</span>
                    )}
                    {item.store_suggestion && <em style={{ fontSize: 11, color: 'var(--faint)', fontStyle: 'normal' }}>{item.store_suggestion}</em>}
                    <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                      onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>×</button>
                  </div>
                ))}
                {!activeShopping.items?.length && (
                  <p style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>Lista e goală. Adaugă primul produs.</p>
                )}
              </div>
            </>
          )}
          {!shopping?.length && !showListForm && (
            <p style={{ color: 'var(--faint)', textAlign: 'center', padding: '3rem 0', fontSize: 14 }}>Nicio listă creată. Crează prima ta listă de cumpărături.</p>
          )}
        </div>
      )}

      {/* ── SCULE ── */}
      {tab === 2 && (
        <div className="j-screen-col">
          <button className="j-btn j-btn-primary j-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowToolForm(s => !s)}>
            <JIcon name="plus" size={13} /> Adaugă sculă
          </button>
          {showToolForm && (
            <TiltCard className="j-card j-panel">
              <form onSubmit={submitTool} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Denumire', 'name', 'text'], ['Brand', 'brand', 'text'],
                  ['Model', 'model', 'text'], ['Data cumpărare', 'purchase_date', 'date'],
                  ['Preț (RON)', 'purchase_price', 'number'], ['Magazin', 'store', 'text'],
                ].map(([l, k, t]) => (
                  <div key={k} className="j-input-group">
                    <label className="j-label">{l}</label>
                    <input className="j-input" type={t} required={k==='name'} value={toolForm[k]} onChange={e => setToolForm(f => ({...f, [k]: e.target.value}))} />
                  </div>
                ))}
                <div className="j-input-group">
                  <label className="j-label">Categorie</label>
                  <select className="j-input" value={toolForm.category} onChange={e => setToolForm(f => ({...f, category: e.target.value}))}>
                    {TOOL_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="j-input-group">
                  <label className="j-label">Stare</label>
                  <select className="j-input" value={toolForm.condition} onChange={e => setToolForm(f => ({...f, condition: e.target.value}))}>
                    {['new', 'good', 'fair', 'poor'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <button className="j-btn j-btn-primary j-btn-sm" type="submit" disabled={addingTool}>
                    {addingTool ? 'Se adaugă...' : 'Salvează'}
                  </button>
                  <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--faint)' }}>Se caută manual automat după salvare</span>
                </div>
              </form>
            </TiltCard>
          )}
          <div className="j-notes-grid">
            {(tools || []).map(t => (
              <TiltCard key={t.id} className="j-card j-note">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 500 }}>{t.name}</h3>
                  <button style={{ color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={async () => { await api.delete(`/api/blajeni2/tools/${t.id}`); qc.invalidateQueries({ queryKey: ['blajeni-tools'] }); }}>×</button>
                </div>
                {(t.brand || t.model) && (
                  <p style={{ fontSize: 12, color: 'var(--dim)' }}>{t.brand} {t.model}</p>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="j-tag">{t.category}</span>
                  {t.condition && <span style={{ fontSize: 11, color: 'var(--faint)', padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 100 }}>{t.condition}</span>}
                </div>
                {t.purchase_price > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{t.purchase_price} RON</span>}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  {t.manual_url && (
                    <a href={t.manual_url} target="_blank" rel="noopener noreferrer"
                      className="j-btn j-btn-ghost j-btn-sm" style={{ fontSize: 11, textDecoration: 'none' }}>
                      📖 Manual
                    </a>
                  )}
                  <button className="j-btn j-btn-ghost j-btn-sm" style={{ fontSize: 11 }}
                    onClick={() => setToolChat(toolChat?.id === t.id ? null : t)}>
                    💬 Asistent
                  </button>
                </div>
                {toolChat?.id === t.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    <ChatPanel
                      endpoint="/api/blajeni2/chat"
                      context={{ brand: t.brand, model: t.model }}
                      placeholder={`Expert ${t.brand} ${t.model}. Întreabă orice despre această sculă.`}
                    />
                  </div>
                )}
              </TiltCard>
            ))}
            {!tools?.length && (
              <p style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: '3rem 0', gridColumn: '1/-1' }}>Nicio sculă adăugată.</p>
            )}
          </div>
        </div>
      )}

      {/* ── ASISTENT GENERAL ── */}
      {tab === 3 && (
        <TiltCard className="j-card j-panel">
          <div className="j-sec-title" style={{ marginBottom: 16 }}>
            <JIcon name="blajeni" size={12} /> Asistent Blajeni
          </div>
          <ChatPanel
            endpoint="/api/blajeni2/chat"
            placeholder="Asistentul casei de la Blajeni. Știe despre proiectele și sculele tale."
          />
        </TiltCard>
      )}
    </div>
  );
}
