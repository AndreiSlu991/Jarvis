export default function Bars({ data = [], height = 80, color = 'var(--accent)' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: '100%', background: color, borderRadius: 3,
              height: `${(d.value / max) * (height - 20)}px`,
              opacity: 0.85,
              animation: `barIn 0.5s ${i * 0.06}s both cubic-bezier(0.34,1.56,0.64,1)`,
              transformOrigin: 'bottom',
            }}
          />
          {d.label && (
            <span style={{ fontSize: 10, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{d.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
