import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="glass relative z-10 w-full sm:max-w-lg max-h-[88vh] overflow-y-auto !rounded-t-3xl sm:!rounded-2xl !bg-surface p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="heading text-lg">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
