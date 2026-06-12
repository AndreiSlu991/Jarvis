const PATHS = {
  car: <><path d="M5 17H3a2 2 0 01-2-2V9l2-4h14l2 4v6a2 2 0 01-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></>,
  home: <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>,
  habits: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></>,
  notes: <><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
  menu: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  budget: <><circle cx="12" cy="12" r="9"/><path d="M12 6v1.5M12 16.5V18M9.5 14.5c0 1.1.9 2 2.5 2s2.5-.9 2.5-2-1-1.8-2.5-2.2c-1.5-.4-2.5-1.1-2.5-2.2 0-1.1.9-2 2.5-2s2.5.9 2.5 2"/></>,
  fitness: <><path d="M4 12h2l2-7 3 14 3-10 2 3h4"/></>,
  bike: <><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h4l2 4M10 8h5"/></>,
  work: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></>,
  blajeni: <><path d="M3 21h18M6 21V10l6-7 6 7v11"/><rect x="9" y="14" width="6" height="7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></>,
  close: <><path d="M18 6L6 18M6 6l12 12"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <><path d="M4 12l5 5L20 7"/></>,
  chevron: <><path d="M9 18l6-6-6-6"/></>,
  more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  mic: <><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6"/></>,
  send: <><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></>,
};

export default function JIcon({ name, size = 18, stroke = 1.5, style, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
    >
      {PATHS[name] || null}
    </svg>
  );
}
