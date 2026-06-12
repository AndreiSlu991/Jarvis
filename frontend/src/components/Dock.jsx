import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import JIcon from './ui/JIcon.jsx';

const PRIMARY = [
  { to: '/',        icon: 'home',    label: 'Home' },
  { to: '/habits',  icon: 'habits',  label: 'Habits' },
  { to: '/notes',   icon: 'notes',   label: 'Notes' },
  { to: '/menu',    icon: 'menu',    label: 'Menu' },
  { to: '/budget',  icon: 'budget',  label: 'Budget' },
];
const MORE = [
  { to: '/fitness', icon: 'fitness', label: 'Fitness' },
  { to: '/bike',    icon: 'bike',    label: 'Bike' },
  { to: '/work',    icon: 'work',    label: 'Work' },
  { to: '/car',     icon: 'car',     label: 'Mașina' },
  { to: '/blajeni', icon: 'blajeni', label: 'Blajeni' },
];

export function MobileBar({ onMore }) {
  const loc = useLocation();
  const moreActive = MORE.some(l => loc.pathname === l.to || (l.to !== '/' && loc.pathname.startsWith(l.to)));

  return (
    <nav className="j-mbar">
      {PRIMARY.map(l => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `j-mbar-btn${isActive ? ' active' : ''}`} end={l.to==='/'}>
          <JIcon name={l.icon} size={22} />
          <span>{l.label}</span>
        </NavLink>
      ))}
      <button className={`j-mbar-btn${moreActive ? ' active' : ''}`} onClick={onMore}>
        <JIcon name="more" size={22} />
        <span>More</span>
      </button>
    </nav>
  );
}

export function MoreSheet({ open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('pointerdown', h), 10);
    return () => document.removeEventListener('pointerdown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="j-sheet-veil" onClick={onClose}>
      <div className="j-sheet" ref={ref} onClick={e => e.stopPropagation()}>
        <div className="j-sheet-grab" />
        <div className="j-sheet-grid">
          {MORE.map(l => (
            <NavLink key={l.to} to={l.to} onClick={onClose}
              className={({ isActive }) => `j-sheet-btn${isActive ? ' active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <JIcon name={l.icon} size={22} />
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dock({ onCommandPalette }) {
  return (
    <nav className="j-dock">
      {[...PRIMARY, ...MORE].map(l => (
        <NavLink key={l.to} to={l.to}
          className={({ isActive }) => `j-dock-btn${isActive ? ' active' : ''}`}
          end={l.to=='/'}
          title={l.label}
        >
          <div className="j-dock-dot" />
          <div className="j-dock-tip">{l.label}</div>
          <JIcon name={l.icon} size={19} />
        </NavLink>
      ))}
      <div className="j-dock-sep" />
      <button className="j-dock-btn" title="Search (⌘K)" onClick={onCommandPalette}>
        <div className="j-dock-tip">Search</div>
        <JIcon name="search" size={19} />
      </button>
    </nav>
  );
}
