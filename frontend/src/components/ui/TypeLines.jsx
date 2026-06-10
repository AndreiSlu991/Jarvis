import { useEffect, useRef, useState } from 'react';

export default function TypeLines({ lines = [], speed = 28, pause = 600 }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (done || !lines.length) return;
    const current = lines[lineIdx] || '';
    if (charIdx < current.length) {
      timerRef.current = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (lineIdx < lines.length - 1) {
      timerRef.current = setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, pause);
    } else {
      setDone(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [charIdx, lineIdx, lines, speed, pause, done]);

  return (
    <div>
      {lines.slice(0, lineIdx + 1).map((line, i) => (
        <p key={i} style={{ margin: '0 0 0.5em', color: 'var(--ink)' }}>
          {i < lineIdx ? line : line.slice(0, charIdx)}
          {i === lineIdx && !done && <span className="j-caret" />}
        </p>
      ))}
    </div>
  );
}
