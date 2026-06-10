import { useRef, useCallback } from 'react';

export default function TiltCard({ children, className = '', intensity = 8, ...props }) {
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = -((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${y * intensity}deg) translateZ(4px)`;
    el.style.setProperty('--sheen-x', `${(x + 1) * 50}%`);
    el.style.setProperty('--sheen-y', `${(y + 1) * 50}%`);
    el.classList.add('tilt-active');
  }, [intensity]);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.classList.remove('tilt-active');
  }, []);

  return (
    <div
      ref={ref}
      className={`j-tilt ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...props}
    >
      {children}
    </div>
  );
}
