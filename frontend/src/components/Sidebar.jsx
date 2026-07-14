import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, BarChart3, History as HistoryIcon, QrCode, Sun, Moon } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/create", label: "Create QR", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: HistoryIcon },
];

function Sidebar() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-brand-600 p-2 rounded-xl">
          <QrCode className="text-white" size={22} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">Smart QR</h1>
          <p className="text-xs text-slate-400">Generator Platform</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Smart QR Generator &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
