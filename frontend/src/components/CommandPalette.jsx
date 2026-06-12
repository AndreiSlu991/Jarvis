import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JIcon from './ui/JIcon.jsx';

const COMMANDS = [
  { id: 'home',    label: 'Dashboard',        kind: 'nav', icon: 'home',    to: '/' },
  { id: 'habits',  label: 'Habits',           kind: 'nav', icon: 'habits',  to: '/habits' },
  { id: 'notes',   label: 'Notes',            kind: 'nav', icon: 'notes',   to: '/notes' },
  { id: 'menu',    label: 'Weekly Menu',      kind: 'nav', icon: 'menu',    to: '/menu' },
  { id: 'budget',  label: 'Budget',           kind: 'nav', icon: 'budget',  to: '/budget' },
  { id: 'fitness', label: 'Fitness',          kind: 'nav', icon: 'fitness', to: '/fitness' },
  { id: 'bike',    label: 'Bike',             kind: 'nav', icon: 'bike',    to: '/bike' },
  { id: 'work',    label: 'Work Recordings',  kind: 'nav', icon: 'work',    to: '/work' },
  { id: 'blajeni', label: 'Blajeni House',    kind: 'nav', icon: 'blajeni', to: '/blajeni' },
  { id: 'car',     label: 'Mașina',          kind: 'nav', icon: 'car',     to: '/car' },
];

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = q
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
    : COMMANDS;

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => { setSel(0); }, [q]);

  const go = (item) => { navigate(item.to); onClose(); };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { if (filtered[sel]) go(filtered[sel]); }
    else if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="j-palette-veil" onClick={onClose}>
      <div className="j-palette" onClick={e => e.stopPropagation()} onKeyDown={onKey}>
        <div className="j-palette-head">
          <JIcon name="search" size={16} />
          <input
            ref={inputRef}
            placeholder="Go to…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <kbd>esc</kbd>
        </div>
        <ul className="j-palette-list" style={{ listStyle: 'none', padding: '8px' }}>
          {filtered.map((c, i) => (
            <li key={c.id}
              className={`j-palette-item${i === sel ? ' sel' : ''}`}
              onPointerDown={() => go(c)}
              onMouseEnter={() => setSel(i)}
              style={{ cursor: 'pointer' }}
            >
              <span className="j-palette-kind">{c.kind}</span>
              <JIcon name={c.icon} size={14} style={{ color: i === sel ? 'var(--accent)' : 'var(--faint)', flexShrink: 0 }} />
              {c.label}
              {i === sel && <kbd className="j-palette-enter">↵</kbd>}
            </li>
          ))}
          {!filtered.length && <li className="j-palette-empty">No results</li>}
        </ul>
      </div>
    </div>
  );
}
