import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, StickyNote, UtensilsCrossed, Wallet,
  Dumbbell, Bike, Mic, Home, LogOut, X
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'Habits', icon: CheckSquare },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/fitness', label: 'Fitness', icon: Dumbbell },
  { to: '/bike', label: 'Bike', icon: Bike },
  { to: '/work', label: 'Work', icon: Mic },
  { to: '/blajeni', label: 'Blajeni', icon: Home }
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { logout } = useAuth();

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-60 bg-surface border-r border-line flex flex-col transition-transform md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-lg font-bold tracking-wide text-gray-100">
            JARVIS<span className="text-accent">.</span>
          </span>
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-surface-2 hover:text-gray-300"
        >
          <LogOut size={17} /> Logout
        </button>
      </aside>
    </>
  );
}
