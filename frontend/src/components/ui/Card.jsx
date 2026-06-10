export default function Card({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-surface border border-line',
    elevated: 'bg-surface-2 border border-line shadow-lg shadow-black/40'
  };
  return (
    <div className={`rounded-xl p-4 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
