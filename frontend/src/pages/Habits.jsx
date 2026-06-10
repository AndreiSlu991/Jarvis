import { useState } from 'react';
import { Plus, Check, Flame, Trash2, Pencil } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

function Heatmap({ recent }) {
  const days = [];
  const set = new Set(recent || []);
  for (let i = 69; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
      {days.map((d) => (
        <span key={d} title={d} className={`h-2.5 w-2.5 rounded-sm ${set.has(d) ? 'bg-green-500' : 'bg-surface-2'}`} />
      ))}
    </div>
  );
}

export default function Habits() {
  const habits = useGet('habits', '/habits');
  const logs = useGet(['habit-logs'], '/habits/logs');
  const streaks = useGet('streaks', '/habits/streaks');
  const [modal, setModal] = useState(null); // null | {} | habit
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });

  const invalidate = ['habits', ['habit-logs'], 'streaks'];
  const save = useAction({ invalidate, successMessage: 'Habit saved' });
  const remove = useAction({ method: 'delete', invalidate, successMessage: 'Habit deleted' });
  const log = useAction({ invalidate: [['habit-logs'], 'streaks'] });

  const doneIds = new Set((logs.data || []).map((l) => l.habit_id));

  const openModal = (habit) => {
    setForm(habit ? { name: habit.name, description: habit.description || '', color: habit.color } : { name: '', description: '', color: COLORS[0] });
    setModal(habit || {});
  };

  const submit = async (e) => {
    e.preventDefault();
    await save.mutateAsync({
      url: modal?.id ? undefined : '/habits',
      ...(modal?.id ? { url: `/habits/${modal.id}` } : {}),
      data: form
    });
    setModal(null);
  };

  if (habits.isLoading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openModal(null)}><Plus size={16} /> New habit</Button>
      </div>
      {(habits.data || []).length === 0 && (
        <Card className="text-center text-sm text-gray-500 py-10">No habits yet. Create your first one.</Card>
      )}
      {(habits.data || []).map((h) => {
        const done = doneIds.has(h.id);
        const s = (streaks.data || []).find((x) => x.id === h.id);
        return (
          <Card key={h.id}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => log.mutate({ url: `/habits/${h.id}/log`, data: { completed: !done } })}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done ? 'border-green-400 bg-green-500/20 text-green-300' : 'border-gray-600 text-transparent hover:border-gray-400'
                }`}
              >
                <Check size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                  <span className="font-medium text-gray-100">{h.name}</span>
                  {s?.streak > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-400"><Flame size={12} />{s.streak}d</span>
                  )}
                </div>
                {h.description && <p className="truncate text-xs text-gray-500">{h.description}</p>}
              </div>
              <div className="hidden sm:block"><Heatmap recent={s?.recent} /></div>
              <div className="flex gap-1">
                <Button variant="ghost" className="!p-2" onClick={() => openModal(h)}><Pencil size={14} /></Button>
                <Button variant="ghost" className="!p-2 text-red-400" loading={remove.isPending}
                  onClick={() => confirm(`Delete "${h.name}"?`) && remove.mutate({ url: `/habits/${h.id}` })}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="mt-3 sm:hidden"><Heatmap recent={s?.recent} /></div>
          </Card>
        );
      })}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit habit' : 'New habit'}>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <span className="mb-1 block text-xs font-medium text-gray-400">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${form.color === c ? 'border-white' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <Button type="submit" loading={save.isPending} className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
