import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Dock, { MobileBar, MoreSheet } from './Dock.jsx';
import CommandPalette from './CommandPalette.jsx';

const TITLES = {
  '/': 'Dashboard', '/habits': 'Habits', '/notes': 'Notes',
  '/menu': 'Weekly Menu', '/budget': 'Budget', '/fitness': 'Fitness',
  '/bike': 'Bike', '/work': 'Work', '/blajeni': 'Blajeni House',
};

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const loc = useLocation();
  const title = TITLES[loc.pathname] || 'Jarvis';

  return (
    <>
      <Dock onCommandPalette={() => setPaletteOpen(true)} />
      <main className="j-main">
        <header className="j-topbar">
          <h1 className="j-topbar-title">{title}</h1>
          <div className="j-topbar-right">
            <button
              className="j-icon-btn"
              onClick={() => setPaletteOpen(true)}
              title="Search (⌘K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>
              </svg>
            </button>
          </div>
        </header>
        <div className="j-content">
          <Outlet />
        </div>
      </main>
      <MobileBar onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
