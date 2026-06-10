import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from './Sidebar';

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-lg md:hidden">
      <div className="flex overflow-x-auto pb-safe [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_LINKS.map(({ to, label, icon: Icon, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-w-[68px] flex-1 flex-col items-center gap-1 px-2 pb-1 pt-2.5 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} style={isActive ? { color } : undefined} />
                <span className="text-[9px] tracking-wide">{label}</span>
                <span
                  className="h-[3px] w-8 rounded-full transition-all duration-150"
                  style={{ background: isActive ? color : 'transparent' }}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
