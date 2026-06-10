import ReactMarkdown from 'react-markdown';
import { RefreshCw, Check, Flame, Bike, Dumbbell, Wallet, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';

const fmt = (n) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(n || 0);

// Split the markdown briefing into compact card-sized sections (by heading or paragraph block).
function briefingSections(content) {
  if (!content) return [];
  const parts = content.split(/\n(?=#{1,3} )/).flatMap((p) =>
    p.length > 600 ? p.split(/\n\n+/) : [p]
  );
  return parts.map((s) => s.trim()).filter(Boolean).slice(0, 6);
}

function MetricCard({ label, value, unit, icon: Icon, color, sub, loading, active = false }) {
  return (
    <Card active={active} className="flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <Icon size={16} style={{ color }} className="opacity-80" />
      </div>
      {loading ? (
        <Skeleton className="h-12 w-24" />
      ) : (
        <div>
          <span className="metric">{value}</span>
          {unit && <span className="ml-1 text-lg font-thin text-muted">{unit}</span>}
        </div>
      )}
      {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const viewMode = useAppStore((s) => s.viewMode);
  const briefing = useGet('briefing', '/briefing/today');
  const habits = useGet('habits', '/habits');
  const logs = useGet(['habit-logs'], '/habits/logs');
  const streaks = useGet('streaks', '/habits/streaks');
  const summary = useGet(['budget-summary'], `/budget/summary?month=${new Date().toISOString().slice(0, 7)}`);
  const bike = useGet('bike-activities', '/bike/activities');
  const fitness = useGet('fitness-sessions', '/fitness/sessions');

  const regenerate = useAction({ url: '/briefing/generate', invalidate: ['briefing'], successMessage: 'Briefing regenerated' });
  const logHabit = useAction({ invalidate: [['habit-logs'], 'streaks'] });

  const doneIds = new Set((logs.data || []).map((l) => l.habit_id));
  const bestStreak = Math.max(0, ...(streaks.data || []).map((s) => s.streak));
  const lastRide = (bike.data || [])[0];
  const today = new Date().toISOString().slice(0, 10);
  const todaySession = (fitness.data || []).find((s) => s.date === today && s.type !== 'metrics');
  const habitsDone = doneIds.size;
  const habitsTotal = (habits.data || []).length;
  const dense = viewMode === 'dense';
  const sections = briefingSections(briefing.data?.content);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* LEFT PANEL — briefing */}
      <section className={dense ? 'lg:col-span-3' : 'lg:col-span-3'}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="heading text-base flex items-center gap-2">
            <Sparkles size={15} className="text-accent" /> Daily briefing
          </h2>
          <Button variant="ghost" loading={regenerate.isPending} onClick={() => regenerate.mutate({})} className="!p-2">
            <RefreshCw size={15} />
          </Button>
        </div>

        {briefing.isLoading || regenerate.isPending ? (
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
          </div>
        ) : briefing.isError ? (
          <Card><p className="text-sm text-red-400">{briefing.error.message}</p></Card>
        ) : (
          <div className="space-y-3">
            {sections.map((section, i) => (
              <Card key={i} active={i === 0}>
                <div className="prose-dark text-sm text-white/75">
                  <ReactMarkdown>{section}</ReactMarkdown>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Habit quick-check strip */}
        <div className="mt-5">
          <span className="label mb-3 block">Today's habits</span>
          {habits.isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-24" />
            </div>
          ) : habitsTotal === 0 ? (
            <p className="text-sm text-muted">No habits yet — add some in the Habits tab.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {habits.data.map((h) => {
                const done = doneIds.has(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => logHabit.mutate({ url: `/habits/${h.id}/log`, data: { completed: !done } })}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-150 ${
                      done
                        ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
                        : 'border-glass-border bg-glass text-muted hover:border-line-bright hover:text-primary'
                    }`}
                  >
                    <Check size={13} className={done ? '' : 'opacity-30'} />
                    {h.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RIGHT PANEL — metrics grid */}
      <section className="lg:col-span-2">
        <span className="label mb-3 block">Metrics</span>
        <div className={`grid gap-3 ${dense ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-2'}`}>
          <MetricCard
            label="Streak" icon={Flame} color="#7c3aed"
            value={bestStreak} unit="days"
            sub={`${habitsDone}/${habitsTotal} habits done today`}
            loading={streaks.isLoading}
            active={bestStreak > 0 && habitsDone === habitsTotal && habitsTotal > 0}
          />
          <MetricCard
            label="Budget" icon={Wallet} color="#f59e0b"
            value={fmt(summary.data?.balance)} unit="lei"
            sub={`${fmt(summary.data?.expenses)} spent this month`}
            loading={summary.isLoading}
          />
          <MetricCard
            label="Last ride" icon={Bike} color="#10b981"
            value={lastRide ? (lastRide.distance ?? 0).toFixed(0) : '—'} unit={lastRide ? 'km' : ''}
            sub={lastRide ? `${lastRide.title} · ${lastRide.date}` : 'No rides yet'}
            loading={bike.isLoading}
          />
          <MetricCard
            label="Workout" icon={Dumbbell} color="#10b981"
            value={todaySession ? todaySession.duration : '0'} unit="min"
            sub={todaySession ? 'Done this morning' : 'Not logged today'}
            loading={fitness.isLoading}
          />
        </div>
      </section>
    </div>
  );
}
