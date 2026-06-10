export default function Input({ label, error, className = '', as = 'input', ...props }) {
  const Tag = as;
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>}
      <Tag
        className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent transition-colors ${
          error ? 'border-red-500' : 'border-line'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
