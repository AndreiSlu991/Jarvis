import { useRef, useState } from 'react';
import { Upload, FileText, Plus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';

const fmt = (n) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(n);

export default function Budget() {
  const month = new Date().toISOString().slice(0, 7);
  const summary = useGet(['budget-summary'], `/budget/summary?month=${month}`);
  const txs = useGet(['transactions'], `/budget/transactions?month=${month}`);
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', description: '', category: 'other' });
  const [uploading, setUploading] = useState(null);
  const csvRef = useRef();
  const pdfRef = useRef();

  const add = useAction({ url: '/budget/transactions', invalidate: [['transactions'], ['budget-summary']], successMessage: 'Transaction added' });

  async function uploadImport(kind, file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(kind);
    try {
      const { data } = await api.post(`/budget/import/${kind}`, fd);
      toast.success(kind === 'csv' ? `Imported ${data.imported} transactions` : data.parsed ? 'Salary parsed from PDF' : 'PDF read, but no net pay found');
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['budget-summary'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  }

  async function gmailConnect() {
    try {
      const { data } = await api.get('/budget/gmail/auth');
      window.open(data.url, '_blank');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const s = summary.data;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income', value: s?.income, color: 'text-green-400' },
          { label: 'Expenses', value: s?.expenses, color: 'text-red-400' },
          { label: 'Balance', value: s?.balance, color: 'text-primary' }
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <p className="label !text-[10px]">{label}</p>
            <p className={`mt-1 text-lg font-medium ${color}`}>
              {summary.isLoading ? <LoadingSpinner size="sm" /> : fmt(value || 0)}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={uploading === 'csv'} onClick={() => csvRef.current.click()}>
          <Upload size={15} /> Import CSV
        </Button>
        <Button variant="secondary" loading={uploading === 'pdf'} onClick={() => pdfRef.current.click()}>
          <FileText size={15} /> Salary slip
        </Button>
        <Button variant="secondary" onClick={gmailConnect}><Mail size={15} /> Gmail</Button>
        <Button className="ml-auto" onClick={() => setModal(true)}><Plus size={15} /> Add</Button>
        <input ref={csvRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files[0] && uploadImport('csv', e.target.files[0])} />
        <input ref={pdfRef} type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onChange={(e) => e.target.files[0] && uploadImport('pdf', e.target.files[0])} />
      </div>

      {s?.by_category?.length > 0 && (
        <Card>
          <h3 className="mb-2 text-sm font-medium text-primary">By category</h3>
          <div className="space-y-1.5">
            {s.by_category.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted">{c.category}</span>
                <span className={c.total < 0 ? 'text-red-400' : 'text-green-400'}>{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-2 text-sm font-medium text-primary">Transactions — {month}</h3>
        {txs.isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (txs.data || []).length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No transactions this month.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {txs.data.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-white/75">{t.description || t.category}</p>
                  <p className="text-[11px] text-white/30">{t.date} · {t.source}</p>
                </div>
                <span className={`ml-3 shrink-0 font-medium ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {fmt(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add transaction">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await add.mutateAsync({ data: { ...form, amount: parseFloat(form.amount) } });
            setModal(false);
          }}
          className="space-y-3"
        >
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Amount (negative = expense)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Button type="submit" loading={add.isPending} className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
