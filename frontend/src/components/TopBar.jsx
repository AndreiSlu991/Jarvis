import { useLocation } from 'react-router-dom';
import { Menu, LayoutGrid, Rows3 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/appStore';

const titles = {
  '/': 'Dashboard', '/habits': 'Habits', '/notes': 'Notes', '/menu': 'Menu',
  '/budget': 'Budget', '/fitness': 'Fitness', '/bike': 'Bike', '/work': 'Work', '/blajeni': 'Blajeni'
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { viewMode, toggleViewMode, setSidebarOpen } = useAppStore();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-100">{titles[pathname] || 'Jarvis'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-gray-500">
          {format(new Date(), 'EEE, d MMM yyyy')}
        </span>
        <button
          onClick={toggleViewMode}
          title={`Switch to ${viewMode === 'minimal' ? 'dense' : 'minimal'} view`}
          className="rounded-lg p-2 text-gray-400 hover:bg-surface-2"
        >
          {viewMode === 'minimal' ? <LayoutGrid size={17} /> : <Rows3 size={17} />}
        </button>
      </div>
    </header>
  );
}
