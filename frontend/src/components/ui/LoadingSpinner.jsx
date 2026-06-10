export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' };
  return (
    <span
      className={`inline-block animate-spin rounded-full border-white/15 border-t-accent ${sizes[size]} ${className}`}
    />
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass space-y-3 p-4 ${className}`}>
      <div className="skeleton h-3 w-24" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
