import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGet, useAction } from '../hooks/useApi';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';

const TODAY = new Date().toISOString().slice(0, 10);

function WeekDots({ habitId, logs }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const set = new Set((logs || []).filter((l) => l.habit_id === habitId).map((l) => l.date));
  return (
    <div className="j-week">
      {days.map((d) => (
        <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className={set.has(d) ? 'j-week-dot on' : 'j-week-dot'} />
          <span className="j-week-day">{new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}</span>
        </div>
      ))}
    </div>
  );
}

function HabitRow({ habit, done, logs, streak }) {
  const queryClient = useQueryClient();
  const [burst, setBurst] = useState(false);

  const handleToggle = useCallback(async () => {
    await api.post('/api/habits/' + habit.id + '/log');
    queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['streaks'] });
    if (!done) {
      setBurst(true);
      setTimeout(() => setBurst(false), 650);
    }
  }, [habit.id, done, queryClient]);

  return (
    <div className="j-habit-row">
      <button
        className={done ? 'j-habit-check big done' : 'j-habit-check big'}
        onClick={handleToggle}
        title={done ? 'Mark undone' : 'Mark done'}
      >
        {burst && <span className="j-burst" />}
        {done && <JIcon name="check" />}
      </button>
      <div className="j-habit-info">
        <span className={done ? 'j-habit-name done' : 'j-habit-name'}>{habit.name}</span>
        {habit.time_of_day && (
          <span className="j-habit-time">{habit.time_of_day}</span>
        )}
        <WeekDots habitId={habit.id} logs={logs} />
      </div>
      {streak > 0 && (
        <div className="j-streak">
          <JIcon name="flame" />
          <span>{streak}d</span>
        </div>
      )}
    </div>
  );
}

export default function Habits() {
  const habits = useGet('habits', '/api/habits');
  const logs = useGet('habit-logs', '/api/habits/logs?date=' + TODAY);
  const streaks = useGet('streaks', '/api/habits/streaks');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', time_of_day: '' });

  const addHabit = useAction({
    method: 'post',
    url: '/api/habits',
    invalidate: ['habits'],
  });

  const doneIds = new Set((logs.data || []).map((l) => l.habit_id));
  const streakMap = streaks.data || {};

  const handleAdd = async (e) => {
    e.preventDefault();
    await addHabit.mutateAsync({ name: form.name, time_of_day: form.time_of_day || undefined });
    setForm({ name: '', time_of_day: '' });
    setShowAdd(false);
  };

  return (
    <div className="j-screen-col">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="j-sec-title">Habits</span>
        <button className="j-btn j-btn-primary j-btn-sm" onClick={() => setShowAdd((v) => !v)}>
          <JIcon name="plus" /> {showAdd ? 'Cancel' : 'Add habit'}
        </button>
      </div>

      {showAdd && (
        <div className="j-card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="j-input-group">
              <label className="j-label">Habit name</label>
              <input
                className="j-input"
                placeholder="e.g. Morning run"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="j-input-group">
              <label className="j-label">Time of day (optional)</label>
              <input
                className="j-input"
                placeholder="e.g. Morning"
                value={form.time_of_day}
                onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
              />
            </div>
            <button type="submit" className="j-btn j-btn-primary" disabled={addHabit.isPending}>
              {addHabit.isPending ? 'Saving…' : 'Save habit'}
            </button>
          </form>
        </div>
      )}

      {habits.isLoading && (
        <div className="j-habit-list">
          {[1, 2, 3].map((i) => <div key={i} className="j-skel" style={{ height: 72, borderRadius: 12, marginBottom: 8 }} />)}
        </div>
      )}

      {!habits.isLoading && (habits.data || []).length === 0 && (
        <div className="j-card" style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.6 }}>
          No habits yet. Add your first one above.
        </div>
      )}

      {!habits.isLoading && (
        <div className="j-habit-list">
          {(habits.data || []).map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              done={doneIds.has(h.id)}
              logs={logs.data}
              streak={streakMap[h.id]?.current || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
