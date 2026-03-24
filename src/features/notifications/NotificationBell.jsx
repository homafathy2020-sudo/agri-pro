// src/features/notifications/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { AlertIcon, WrenchIcon, DriverIcon } from "../../components/ui/Icons";

const SEVERITY_COLORS = {
  high:   { bg: "bg-red-900/30 border-red-800/40",    icon: "text-red-400",   dot: "bg-red-500"   },
  medium: { bg: "bg-amber-900/30 border-amber-800/40", icon: "text-amber-400", dot: "bg-amber-500" },
};

const TYPE_ICONS = {
  maintenance_due: WrenchIcon,
  debt_overdue:    DriverIcon,
};

const NotificationBell = () => {
  const { notifications, totalCount, highCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const navigate        = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAction = (path) => { setOpen(false); navigate(path); };

  return (
    <div className="relative" ref={ref}>

      {/* Bell button */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 border border-white/10 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <AlertIcon size={18} />
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${highCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown — right-aligned for RTL */}
      {open && (
        <div className="absolute top-11 right-0 z-50 w-80 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <p className="text-sm font-bold text-gray-100">التنبيهات</p>
            {totalCount > 0 && (
              <span className="text-xs text-gray-500">{totalCount} تنبيه</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">لا توجد تنبيهات</p>
              </div>
            ) : (
              notifications.map((n) => {
                const colors   = SEVERITY_COLORS[n.severity];
                const TypeIcon = TYPE_ICONS[n.type] ?? AlertIcon;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-4 border-b border-white/8 last:border-0 cursor-pointer hover:bg-white/3 transition-colors`}
                    onClick={() => n.actionPath && handleAction(n.actionPath)}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <TypeIcon size={15} className={colors.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-100 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                      {n.actionLabel && (
                        <p className="text-xs text-brand-400 mt-1 font-semibold">{n.actionLabel} ←</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${colors.dot}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
