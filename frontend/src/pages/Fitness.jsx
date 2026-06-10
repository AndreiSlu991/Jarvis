import { useState } from 'react';
import { Dumbbell, Plus, Moon, HeartPulse, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';

export default function Fitness() {
  const sessions = useGet('fitness-sessions', '/fitness/sessions');
  const [advice, setAdvice] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ duration: 15, hrv: '', sleep_score: '', notes: '' });

  const getAdvice = useAction({ method: 'get', url: '/fitness/today' });
  const logSession = useAction({ url: '/fitness/sessions', invalidate: ['fitness-sessions'], successMessage: 'Session logged' });

  const recent = (sessions.data || []).slice(0, 14);
  const maxHrv = Math.max(...recent.map((s) => s.hrv || 0), 1);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
            <Dumbbell size={16} /> Today's workout · 15 min · kettlebell + bands
          </h2>
          <Button variant="secondary" loading={getAdvice.isPending}
            onClick={async () => setAdvice(await getAdvice.mutateAsync({}))}>
            <Sparkles size={14} /> Get plan
          </Button>
        </div>
        {getAdvice.isPending && (
          <div className="flex items-center gap-3 py-6 justify-center text-sm text-gray-500">
            <LoadingSpinner /> Adapting to your HRV and sleep…
          </div>
        )}
        {advice && (
          <div className="space-y-2 text-sm">
            <p>
              <span className={`rounded px-2 py-0.5 text-xs uppercase ${
                advice.intensity === 'high' ? 'bg-red-500/15 text-red-300' :
                advice.intensity === 'low' ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'
              }`}>{advice.intensity} intensity</span>
            </p>
            <p className="text-gray-400">{advice.rationale}</p>
            <ul className="space-y-1.5">
              {(advice.exercises || []).map((ex, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <span className="text-gray-200">{ex.name}</span>
                  <span className="text-xs text-gray-500">{ex.sets}×{ex.reps} · {ex.equipment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!advice && !getAdvice.isPending && (
          <p className="text-sm text-gray-500">Tap "Get plan" for a Claude-generated workout adapted to your recent HRV and sleep.</p>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setModal(true)}><Plus size={15} /> Log session</Button>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-100">HRV trend</h3>
        {recent.filter((s) => s.hrv).length === 0 ? (
          <p className="text-sm text-gray-500">No HRV data yet — log it with your sessions.</p>
        ) : (
          <div className="flex h-24 items-end gap-1">
            {[...recent].reverse().map((s) => (
              <div key={s.id} className="flex-1" title={`${s.date}: HRV ${s.hrv ?? '—'}, sleep ${s.sleep_score ?? '—'}`}>
                <div className="rounded-t bg-accent/70" style={{ height: `${((s.hrv || 0) / maxHrv) * 96}px` }} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-gray-100">Recent sessions</h3>
        {sessions.isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-gray-300">{s.date} · {s.type} · {s.duration} min</p>
                  {s.notes && <p className="text-xs text-gray-600">{s.notes}</p>}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  {s.hrv != null && <span className="flex items-center gap-1"><HeartPulse size={12} />{s.hrv}</span>}
                  {s.sleep_score != null && <span className="flex items-center gap-1"><Moon size={12} />{s.sleep_score}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Log session">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await logSession.mutateAsync({
              data: {
                duration: parseInt(form.duration, 10),
                hrv: form.hrv ? parseFloat(form.hrv) : null,
                sleep_score: form.sleep_score ? parseFloat(form.sleep_score) : null,
                notes: form.notes
              }
            });
            setModal(false);
          }}
          className="space-y-3"
        >
          <Input label="Duration (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
          <Input label="HRV (from Garmin)" type="number" step="0.1" value={form.hrv} onChange={(e) => setForm({ ...form, hrv: e.target.value })} />
          <Input label="Sleep score (from Garmin)" type="number" value={form.sleep_score} onChange={(e) => setForm({ ...form, sleep_score: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" loading={logSession.isPending} className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
