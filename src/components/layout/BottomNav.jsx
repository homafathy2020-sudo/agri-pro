// src/components/layout/BottomNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useNotifications } from "../../hooks/useNotifications";
import { HomeIcon, TractorIcon, ClipboardIcon, AlertIcon, ChartIcon } from "../ui/Icons";

const ITEMS = [
  { to: "/",          label: "الرئيسية", Icon: HomeIcon      },
  { to: "/equipment", label: "المعدات",  Icon: TractorIcon   },
  { to: "/jobs",      label: "الشغل",    Icon: ClipboardIcon },
  { to: "/clients",   label: "العملاء",  Icon: AlertIcon     },
  { to: "/reports",   label: "تقارير",   Icon: ChartIcon     },
];

const BottomNav = () => {
  const { totalCount, highCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 pb-safe lg:hidden">
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors relative",
              isActive ? "text-brand-400" : "text-gray-500 hover:text-gray-300"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={20} className={isActive ? "text-brand-400" : "text-gray-500"} />
                {/* Show notification dot on clients tab */}
                {to === "/clients" && totalCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${highCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
                    {totalCount > 9 ? "+" : totalCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
