import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, BarChart3, History as HistoryIcon } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/create", label: "Create", icon: PlusCircle },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/history", label: "History", icon: HistoryIcon },
];

function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-2 z-50 transition-colors duration-300">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400"
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
