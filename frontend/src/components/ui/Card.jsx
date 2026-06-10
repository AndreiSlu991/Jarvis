export default function Card({ children, className = '', variant = 'default', active = false, ...props }) {
  const variants = {
    default: 'glass glass-hover',
    elevated: 'glass glass-hover shadow-xl shadow-black/50'
  };
  return (
    <div className={`${active ? 'gradient-border' : variants[variant]} p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
