import { useEffect, useRef, useState } from 'react';

export default function Counter({ value, duration = 900, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const to = parseFloat(value) || 0;
    const from = fromRef.current;
    fromRef.current = to;
    const diff = to - from;
    if (diff === 0) { setDisplay(to); return; }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(from + diff * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const fmt = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  return <>{prefix}{fmt}{suffix}</>;
}
