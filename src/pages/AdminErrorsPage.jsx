// src/pages/AdminErrorsPage.jsx
import React, { useState } from "react";
import { useAdminErrors } from "../hooks/useAdminErrors";
import { Card, Badge, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/ui/LoadingScreen";
import { formatDateTime } from "../utils/formatters";
import { BugIcon, CheckCircleIcon, ClearIcon, TrashIcon, RestoreIcon } from "../components/ui/Icons";

const SOURCE_LABEL = {
  boundary: "شاشة (React)",
  window:   "كود JS",
  promise:  "Promise",
  app:      "التطبيق",
};

const ErrorRow = ({ log, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
          ${log.resolved ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
          {log.resolved ? <CheckCircleIcon size={16} /> : <BugIcon size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={log.resolved ? "green" : "red"}>
              {log.resolved ? "اتحلت" : "لسه مفتوحة"}
            </Badge>
            <Badge variant="gray">{SOURCE_LABEL[log.source] || log.source}</Badge>
            {log.page && <Badge variant="blue">{log.page}</Badge>}
          </div>

          <button onClick={() => setOpen((o) => !o)} className="text-right w-full">
            <p className="text-sm font-bold text-gray-100 break-words">{log.message || "خطأ بدون رسالة"}</p>
          </button>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span style={{ direction: "ltr" }}>{log.userEmail || "—"}</span>
            <span>•</span>
            <span>{formatDateTime(log.createdAt)}</span>
          </div>

          {open && log.stack && (
            <pre className="mt-3 p-3 bg-surface-2 rounded-xl text-[11px] text-gray-400 overflow-x-auto whitespace-pre-wrap break-words" style={{ direction: "ltr", textAlign: "left" }}>
              {log.stack}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button size="xs" variant={log.resolved ? "secondary" : "primary"}
            onClick={() => onToggle(log.id, log.resolved)}>
            {log.resolved ? "افتحها تاني" : "اتحلت"}
          </Button>
          <Button size="xs" variant="ghost" icon={<TrashIcon size={14} />}
            onClick={() => onDelete(log.id)} />
        </div>
      </div>
    </Card>
  );
};

const AdminErrorsPage = () => {
  const { logs, loading, error, reload, toggleResolved, removeLog } = useAdminErrors();
  const [filter, setFilter] = useState("open"); // "open" | "all"

  if (loading) return <LoadingScreen message="جاري تحميل سجل الأخطاء..." />;

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
        <EmptyState
          icon={<BugIcon size={48} className="text-red-500 mx-auto mb-2" />}
          title="تعذر تحميل سجل الأخطاء"
          description="تأكد إن الـ rules متنشورة صح على Firebase"
          action={<Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload}>إعادة المحاولة</Button>}
        />
      </div>
    );
  }

  const visible = filter === "open" ? logs.filter((l) => !l.resolved) : logs;
  const openCount = logs.filter((l) => !l.resolved).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <BugIcon size={22} className="text-brand-400" />
          سجل الأخطاء
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {openCount > 0 ? `${openCount} خطأ لسه مفتوح` : "مفيش أخطاء مفتوحة 🎉"}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("open")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === "open" ? "bg-brand-600 text-white" : "bg-surface-2 text-gray-400"}`}>
          المفتوحة ({openCount})
        </button>
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === "all" ? "bg-brand-600 text-white" : "bg-surface-2 text-gray-400"}`}>
          الكل ({logs.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ClearIcon size={48} className="text-gray-600 mx-auto mb-2" />}
          title={filter === "open" ? "مفيش أخطاء مفتوحة" : "لسه مفيش أخطاء مسجلة"}
          description={filter === "open" ? "كل حاجة تمام دلوقتي" : "الأخطاء هتظهر هنا أول ما تحصل"}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((log) => (
            <ErrorRow key={log.id} log={log} onToggle={toggleResolved} onDelete={removeLog} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminErrorsPage;
