import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import TiltCard from '../components/ui/TiltCard.jsx';
import Counter from '../components/ui/Counter.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';

const fmt = (n) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(n ?? 0);

const CAT_COLORS = {
  food: '#f97316',
  transport: '#3b82f6',
  utilities: '#8b5cf6',
  health: '#10b981',
  salary: '#22c55e',
  other: '#6b7280',
};

function catColor(cat) {
  return CAT_COLORS[cat?.toLowerCase()] ?? '#6b7280';
}

export default function Budget() {
  const txs = useGet(['transactions'], '/budget/transactions?limit=20');
  const summary = useGet(['budget-summary'], '/budget/summary?months=1');
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    description: '',
    category: 'other',
  });
  const [deleting, setDeleting] = useState(null);

  const add = useAction({
    url: '/budget/transactions',
    invalidate: [['transactions'], ['budget-summary']],
    successMessage: 'Transaction added',
  });

  async function deleteTx(id) {
    setDeleting(id);
    try {
      await api.delete(`/budget/transactions/${id}`);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['budget-summary'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const s = summary.data;
  const cats = s?.by_category ?? [];
  const totalAbs = cats.reduce((acc, c) => acc + Math.abs(c.total ?? 0), 0) || 1;

  return (
    <div className="j-screen-col">
      {/* top stat strip */}
      <div className="j-split" style={{ gap: 12 }}>
        <TiltCard className="j-card" style={{ flex: 1 }}>
          <div className="j-eyebrow">Income</div>
          <div className="j-stat-lg" style={{ color: 'var(--green)' }}>
            <Counter value={s?.income ?? 0} decimals={2} />
          </div>
        </TiltCard>
        <TiltCard className="j-card" style={{ flex: 1 }}>
          <div className="j-eyebrow">Expenses</div>
          <div className="j-stat-lg" style={{ color: 'var(--red)' }}>
            <Counter value={s?.expenses ?? 0} decimals={2} />
          </div>
        </TiltCard>
        <TiltCard className="j-card" style={{ flex: 1 }}>
          <div className="j-eyebrow">Balance</div>
          <div className="j-stat-lg">
            <Counter value={s?.balance ?? 0} decimals={2} />
          </div>
        </TiltCard>
      </div>

      {/* category strip */}
      {cats.length > 0 && (
        <div className="j-card">
          <div className="j-sec-title">By category</div>
          <div className="j-cat-strip" style={{ marginTop: 10 }}>
            {cats.map((c) => (
              <div
                key={c.category}
                className="j-cat-seg"
                style={{
                  width: `${(Math.abs(c.total ?? 0) / totalAbs) * 100}%`,
                  background: catColor(c.category),
                }}
                title={`${c.category}: ${fmt(c.total)}`}
              />
            ))}
          </div>
          <div className="j-cat-legend" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {cats.map((c) => (
              <span key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--fg-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: catColor(c.category), display: 'inline-block' }} />
                <span style={{ textTransform: 'capitalize' }}>{c.category}</span>
                <span style={{ color: c.total < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(c.total)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* transactions */}
      <div className="j-card" style={{ flex: 1 }}>
        <div className="j-row-head">
          <div className="j-sec-title">Transactions</div>
          <button className="j-btn j-btn-primary j-btn-sm" onClick={() => setModal(true)}>
            <JIcon name="plus" /> Add
          </button>
        </div>

        {txs.isLoading ? (
          <div className="j-skel" style={{ height: 200, marginTop: 12 }} />
        ) : (txs.data ?? []).length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '32px 0', fontSize: 14 }}>
            No transactions yet.
          </p>
        ) : (
          <ul className="j-tx-list">
            {(txs.data ?? []).map((t) => (
              <li key={t.id} className="j-tx">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: catColor(t.category),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="j-tx-name">{t.description || t.category}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="j-tx-cat">{t.category}</span>
                      <span className="j-tx-date">{t.date}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`j-tx-amt${t.amount >= 0 ? ' pos' : ''}`}>{fmt(t.amount)}</span>
                  <button
                    className="j-btn j-btn-ghost j-btn-sm"
                    style={{ color: 'var(--red)', opacity: deleting === t.id ? 0.5 : 1 }}
                    onClick={() => deleteTx(t.id)}
                    disabled={deleting === t.id}
                  >
                    <JIcon name="trash" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* add modal */}
      {modal && (
        <div className="j-modal-veil" onClick={() => setModal(false)}>
          <div className="j-modal" onClick={(e) => e.stopPropagation()}>
            <div className="j-modal-grab" />
            <div className="j-modal-head">Add Transaction</div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await add.mutateAsync({ data: { ...form, amount: parseFloat(form.amount) } });
                setModal(false);
                setForm({ date: new Date().toISOString().slice(0, 10), amount: '', description: '', category: 'other' });
              }}
            >
              <div className="j-input-group">
                <label className="j-label">Date</label>
                <input className="j-input" type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="j-input-group">
                <label className="j-label">Amount (negative = expense)</label>
                <input className="j-input" type="number" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="j-input-group">
                <label className="j-label">Description</label>
                <input className="j-input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="j-input-group">
                <label className="j-label">Category</label>
                <input className="j-input" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="j-btn j-btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="j-btn j-btn-primary" style={{ flex: 1 }} disabled={add.isPending}>
                  {add.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
