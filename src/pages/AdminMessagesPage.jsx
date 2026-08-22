// src/pages/AdminMessagesPage.jsx
import React, { useState } from "react";
import { useAdminBroadcast } from "../hooks/useAdminBroadcast";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { Card, Badge, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/ui/LoadingScreen";
import { formatDateTime } from "../utils/formatters";
import { MegaphoneIcon, SendIcon, TrashIcon } from "../components/ui/Icons";

const AdminMessagesPage = () => {
  const { history, loading, sending, send, remove } = useAdminBroadcast();
  const { users } = useAdminUsers();

  const [title, setTitle]     = useState("");
  const [body, setBody]       = useState("");
  const [severity, setSeverity] = useState("medium");
  const [target, setTarget]   = useState("all"); // "all" | uid

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const ok = await send({
      title: title.trim(),
      body: body.trim(),
      severity,
      targetUserId: target === "all" ? null : target,
    });
    if (ok) { setTitle(""); setBody(""); }
  };

  if (loading) return <LoadingScreen message="جاري تحميل السجل..." />;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <MegaphoneIcon size={22} className="text-brand-400" />
          إرسال تنبيه
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">بيظهر للمستخدم جوه صفحة "التنبيهات" بتاعته</p>
      </div>

      <Card className="p-5 mb-8">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">لمين؟</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-brand-600">
              <option value="all">كل الشركات</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">العنوان</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: صيانة مجدولة الليلة"
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">الرسالة</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
              placeholder="تفاصيل الرسالة..."
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">الأهمية</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSeverity("medium")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${severity === "medium" ? "bg-amber-900/40 text-amber-400 border-amber-800/50" : "bg-surface-2 text-gray-500 border-white/10"}`}>
                تنبيه عادي
              </button>
              <button type="button" onClick={() => setSeverity("high")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${severity === "high" ? "bg-red-900/40 text-red-400 border-red-800/50" : "bg-surface-2 text-gray-500 border-white/10"}`}>
                عاجل
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" loading={sending}
            icon={<SendIcon size={16} />} disabled={!title.trim() || !body.trim()}>
            إرسال
          </Button>
        </form>
      </Card>

      <h2 className="text-sm font-bold text-gray-300 mb-3">آخر الرسائل المرسلة</h2>
      {history.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon size={40} className="text-gray-600 mx-auto mb-2" />}
          title="لسه معملتش أي إرسال"
          description="أي رسالة تبعتها هتظهر هنا"
        />
      ) : (
        <div className="space-y-2.5">
          {history.map((m) => (
            <Card key={m.id} className="p-3.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold text-gray-100 truncate">{m.title}</p>
                  <Badge variant={m.severity === "high" ? "red" : "amber"}>
                    {m.severity === "high" ? "عاجل" : "عادي"}
                  </Badge>
                  <Badge variant={m.targetUserId ? "blue" : "purple"}>
                    {m.targetUserId ? (users.find((u) => u.id === m.targetUserId)?.displayName || "شركة محددة") : "كل الشركات"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{m.body}</p>
                <p className="text-[11px] text-gray-600 mt-1">{formatDateTime(m.createdAt)}</p>
              </div>
              <Button size="xs" variant="ghost" icon={<TrashIcon size={14} />} onClick={() => remove(m.id)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;
