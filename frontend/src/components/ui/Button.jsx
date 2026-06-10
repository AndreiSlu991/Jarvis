import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children, variant = 'primary', loading = false, disabled, className = '', ...props
}) {
  const variants = {
    primary: 'bg-accent hover:bg-blue-600 text-white',
    secondary: 'bg-surface-2 hover:bg-line text-gray-200 border border-line',
    ghost: 'hover:bg-surface-2 text-gray-300',
    danger: 'bg-red-600/90 hover:bg-red-600 text-white'
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
