import ReactMarkdown from 'react-markdown';
import { RefreshCw, Check, Flame } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';

export default function Dashboard() {
  const viewMode = useAppStore((s) => s.viewMode);
  const briefing = useGet('briefing', '/briefing/today');
  const habits = useGet('habits', '/habits');
  const logs = useGet(['habit-logs'], '/habits/logs');
  const streaks = useGet('streaks', '/habits/streaks');
  const tasks = useGet('blajeni-tasks', '/blajeni/tasks');
  const notes = useGet('notes', '/notes');

  const regenerate = useAction({ url: '/briefing/generate', invalidate: ['briefing'], successMessage: 'Briefing regenerated' });
  const logHabit = useAction({ invalidate: [['habit-logs'], 'streaks'] });

  const doneIds = new Set((logs.data || []).map((l) => l.habit_id));
  const openTasks = (tasks.data || []).filter((t) => t.status !== 'done').slice(0, 5);
  const recentNotes = (notes.data || []).slice(0, 4);
  const dense = viewMode === 'dense';

  return (
    <div className={`grid gap-4 ${dense ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'}`}>
      <Card className={dense ? 'lg:col-span-2' : ''}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Daily briefing</h2>
          <Button variant="ghost" loading={regenerate.isPending} onClick={() => regenerate.mutate({})} className="!p-2">
            <RefreshCw size={15} />
          </Button>
        </div>
        {briefing.isLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-sm text-gray-500">
            <LoadingSpinner /> Generating your briefing…
          </div>
        ) : briefing.isError ? (
          <p className="text-sm text-red-400">{briefing.error.message}</p>
        ) : (
          <div className="prose-dark text-sm text-gray-300">
            <ReactMarkdown>{briefing.data?.content || ''}</ReactMarkdown>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Today's habits</h2>
          {habits.isLoading ? (
            <LoadingSpinner />
          ) : (habits.data || []).length === 0 ? (
            <p className="text-sm text-gray-500">No habits yet — add some in the Habits tab.</p>
          ) : (
            <div className="space-y-2">
              {habits.data.map((h) => {
                const done = doneIds.has(h.id);
                const streak = (streaks.data || []).find((s) => s.id === h.id)?.streak || 0;
                return (
                  <button
                    key={h.id}
                    onClick={() => logHabit.mutate({ url: `/habits/${h.id}/log`, data: { completed: !done } })}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      done ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-line bg-surface-2 text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${done ? 'border-green-400 bg-green-500/30' : 'border-gray-600'}`}>
                        {done && <Check size={12} />}
                      </span>
                      {h.name}
                    </span>
                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} /> {streak}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {dense && (
          <>
            <Card>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Open tasks</h2>
              {openTasks.length === 0 ? (
                <p className="text-sm text-gray-500">All clear.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {openTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-gray-300">
                      <span className="truncate">{t.title}</span>
                      <span className="ml-2 shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-gray-500">{t.priority}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Recent notes</h2>
              {recentNotes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentNotes.map((n) => (
                    <li key={n.id} className="truncate text-gray-300">{n.title}</li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
