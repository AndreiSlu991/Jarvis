import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, StickyNote, UtensilsCrossed, Wallet,
  Dumbbell, Bike, Mic, Home, LogOut, X, Settings
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../hooks/useAuth';
import { useGet } from '../hooks/useApi';

export const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#7c3aed' },
  { to: '/habits', label: 'Habits', icon: CheckSquare, color: '#7c3aed' },
  { to: '/notes', label: 'Notes', icon: StickyNote, color: '#7c3aed' },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed, color: '#7c3aed' },
  { to: '/budget', label: 'Budget', icon: Wallet, color: '#f59e0b' },
  { to: '/fitness', label: 'Fitness', icon: Dumbbell, color: '#10b981' },
  { to: '/bike', label: 'Bike', icon: Bike, color: '#10b981' },
  { to: '/work', label: 'Work', icon: Mic, color: '#3b82f6' },
  { to: '/blajeni', label: 'Blajeni', icon: Home, color: '#f59e0b' }
];

function usePendingBadges() {
  const habits = useGet('habits', '/habits');
  const logs = useGet(['habit-logs'], '/habits/logs');
  const tasks = useGet('blajeni-tasks', '/blajeni/tasks');
  const recordings = useGet('recordings', '/work/recordings');

  const doneIds = new Set((logs.data || []).map((l) => l.habit_id));
  return {
    '/habits': (habits.data || []).filter((h) => !doneIds.has(h.id)).length,
    '/blajeni': (tasks.data || []).filter((t) => t.status !== 'done').length,
    '/work': (recordings.data || []).reduce(
      (n, r) => n + (r.action_items || []).filter((a) => !a.done).length, 0
    )
  };
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { user, logout } = useAuth();
  const badges = usePendingBadges();

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-[260px] bg-surface border-r border-line flex flex-col transition-transform duration-150 ease-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6 pt-safe">
          <span className="heading text-xl">
            JARVIS<span className="text-accent">.</span>
          </span>
          <button className="md:hidden text-muted" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_LINKS.map(({ to, label, icon: Icon, color }) => {
            const badge = badges[to];
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.04] text-primary'
                      : 'text-muted hover:bg-white/[0.03] hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r"
                        style={{ background: color }}
                      />
                    )}
                    <span className="h-1.5 w-1.5 rounded-full opacity-70" style={{ background: color }} />
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] tabular-nums text-muted">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-line p-4 pb-safe">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-medium uppercase text-accent">
              {(user?.email || '?')[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-primary">{user?.email}</p>
              <p className="label !text-[10px]">Signed in</p>
            </div>
            <button className="rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.05] hover:text-primary" title="Settings">
              <Settings size={16} />
            </button>
            <button onClick={logout} className="rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.05] hover:text-red-400" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
