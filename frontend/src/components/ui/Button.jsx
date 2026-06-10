import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children, variant = 'primary', loading = false, disabled, className = '', ...props
}) {
  const variants = {
    primary: 'bg-accent hover:bg-violet-500 text-white',
    secondary: 'bg-glass hover:bg-white/[0.07] text-primary border border-glass-border hover:border-line-bright',
    ghost: 'hover:bg-white/[0.05] text-muted hover:text-primary',
    danger: 'bg-red-600/80 hover:bg-red-600 text-white'
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
