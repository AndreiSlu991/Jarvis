import { useLocation } from 'react-router-dom';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/appStore';

const titles = {
  '/': 'Dashboard', '/habits': 'Habits', '/notes': 'Notes', '/menu': 'Menu',
  '/budget': 'Budget', '/fitness': 'Fitness', '/bike': 'Bike', '/work': 'Work', '/blajeni': 'Blajeni'
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { viewMode, toggleViewMode } = useAppStore();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/75 px-5 pt-safe backdrop-blur-lg">
      <div className="flex items-center justify-between py-3.5">
        <h1 className="heading text-lg">{titles[pathname] || 'Jarvis'}</h1>
        <div className="flex items-center gap-3">
          <span className="label hidden sm:block !opacity-40">
            {format(new Date(), 'EEE, d MMM yyyy')}
          </span>
          <button
            onClick={toggleViewMode}
            title={`Switch to ${viewMode === 'minimal' ? 'dense' : 'minimal'} view`}
            className="rounded-xl p-2 text-muted transition-all duration-150 hover:bg-white/[0.05] hover:text-primary"
          >
            {viewMode === 'minimal' ? <LayoutGrid size={17} /> : <Rows3 size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
