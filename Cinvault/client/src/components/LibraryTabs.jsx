import { Disc3, Library } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/library", label: "Movies", icon: Library, end: true },
  { to: "/library/bluray", label: "Blu-ray Deals", icon: Disc3 },
];

export default function LibraryTabs() {
  return (
    <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-noir-800/50 p-1">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-amber-500 text-noir-950 shadow-glow"
                : "text-white/40 hover:text-white/70",
            ].join(" ")
          }
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
