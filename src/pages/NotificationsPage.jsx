// src/pages/NotificationsPage.jsx
import React from "react";
import { useNavigate }       from "react-router-dom";
import { useNotifications }  from "../hooks/useNotifications";
import LoadingScreen         from "../components/ui/LoadingScreen";
import { Card }  from "../components/ui/Card";
import Button                from "../components/ui/Button";
import { AlertIcon, WrenchIcon, DriverIcon, WalletIcon } from "../components/ui/Icons";

const SEVERITY_STYLE = {
  high:   {
    border:   "border-red-800/40",
    bg:       "bg-red-900/20",
    icon:     "text-red-400",
    iconBg:   "bg-red-900/30 border-red-800/40",
    label:    "عاجل",
    labelBg:  "bg-red-900/40 text-red-400",
  },
  medium: {
    border:   "border-amber-800/40",
    bg:       "bg-amber-900/20",
    icon:     "text-amber-400",
    iconBg:   "bg-amber-900/30 border-amber-800/40",
    label:    "تنبيه",
    labelBg:  "bg-amber-900/40 text-amber-400",
  },
};

const TYPE_ICONS = {
  maintenance_due:   WrenchIcon,
  debt_overdue:      DriverIcon,
  custody_overdrawn: WalletIcon,
};

const NotificationsPage = () => {
  const { notifications, totalCount, highCount, loading } = useNotifications();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <AlertIcon size={22} className="text-brand-400" />
          التنبيهات
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalCount === 0
            ? "لا توجد تنبيهات نشطة"
            : `${totalCount} تنبيه · ${highCount} عاجل`}
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-green-900/20 border border-green-800/30 flex items-center justify-center">
              <AlertIcon size={26} className="text-green-400" />
            </div>
            <p className="text-sm font-bold text-gray-300">لا توجد تنبيهات</p>
            <p className="text-xs text-gray-500">جميع المعدات والمدفوعات في الوقت المحدد</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const style    = SEVERITY_STYLE[n.severity];
            const TypeIcon = TYPE_ICONS[n.type] ?? AlertIcon;

            return (
              <Card key={n.id} className={`border ${style.border}`}>
                <div className={`p-4 rounded-2xl ${style.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                      <TypeIcon size={18} className={style.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold text-gray-100">{n.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.labelBg}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{n.body}</p>
                    </div>
                  </div>
                  {n.actionPath && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => navigate(n.actionPath)}>
                        {n.actionLabel} ←
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
