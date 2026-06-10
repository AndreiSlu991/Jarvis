export default function Input({ label, error, className = '', as = 'input', ...props }) {
  const Tag = as;
  return (
    <label className="block">
      {label && <span className="label mb-1.5 block">{label}</span>}
      <Tag
        className={`w-full rounded-xl bg-glass border px-3.5 py-2.5 text-sm text-primary placeholder-white/25 outline-none transition-all duration-150 focus:border-accent focus:bg-white/[0.05] ${
          error ? 'border-red-500' : 'border-glass-border'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
