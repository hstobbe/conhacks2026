import { Disc3, Library } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/library", label: "Movies", icon: Library, end: true },
  { to: "/library/bluray", label: "Blu-ray", icon: Disc3 },
];

export default function LibraryTabs() {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/30"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/50 hover:text-white",
            ].join(" ")
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
