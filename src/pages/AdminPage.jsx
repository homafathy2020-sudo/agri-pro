// src/pages/AdminPage.jsx
import React, { useState } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { Card, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/ui/LoadingScreen";
import { formatDateTime, getInitial } from "../utils/formatters";
import { ShieldIcon, UsersGroupIcon, RestoreIcon } from "../components/ui/Icons";

// "من كام؟" نص عربي بسيط بدل تاريخ كامل — بيوضح للأدمن فوراً مين نشط
// دلوقتي ومين ساكت من فترة، من غير ما يقارن تواريخ يدوي.
const timeAgo = (value) => {
  if (!value) return "—";
  const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)   return "دلوقتي";
  if (mins < 60)  return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30)  return `من ${days} يوم`;
  const months = Math.floor(days / 30);
  return `من ${months} شهر`;
};

// أخضر لو نشط خلال آخر يومين، برتقالي لحد أسبوع، رمادي بعد كده —
// إشارة سريعة تلفت نظر الأدمن للحسابات الساكتة من غير ما يقرا كل تاريخ.
const activityColor = (value) => {
  if (!value) return "bg-gray-600";
  const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "bg-gray-600";
  const days = (Date.now() - d.getTime()) / 86400000;
  if (days < 2) return "bg-green-500";
  if (days < 7) return "bg-amber-500";
  return "bg-gray-600";
};

const AdminPage = () => {
  const { users, loading, error, reload } = useAdminUsers();
  const [search, setSearch] = useState("");

  if (loading) return <LoadingScreen message="جاري تحميل قائمة الحسابات..." />;

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
        <EmptyState
          icon={<ShieldIcon size={48} className="text-red-500 mx-auto mb-2" />}
          title="تعذر تحميل قائمة الحسابات"
          description="تأكد إن الـ UID بتاعك مضاف صح في isAdmin() جوه firestore.rules، وإن الـ rules متنشورة"
          action={<Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload}>إعادة المحاولة</Button>}
        />
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (u.displayName || "").toLowerCase().includes(q) ||
           (u.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <ShieldIcon size={22} className="text-brand-400" />
          حسابات الشركات
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} حساب مسجل</p>
      </div>

      {users.length > 0 && (
        <div className="mb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الإيميل..."
            className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UsersGroupIcon size={48} className="text-gray-600 mx-auto mb-2" />}
          title={users.length === 0 ? "لسه مفيش حسابات مسجلة" : "مفيش نتائج"}
          description={users.length === 0 ? "الحسابات هتظهر هنا أول ما حد يسجل" : "جرّب كلمة بحث تانية"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className="p-4 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-400 font-extrabold">
                  {getInitial(u.displayName || u.email)}
                </div>
                <span
                  className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-surface ${activityColor(u.lastActiveAt)}`}
                  title="حالة النشاط"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-100 truncate">
                  {u.displayName || "بدون اسم"}
                </p>
                <p className="text-xs text-gray-500 truncate" style={{ direction: "ltr", textAlign: "right" }}>
                  {u.email || "—"}
                </p>
              </div>

              <div className="text-left flex-shrink-0">
                <p className="text-xs text-gray-500">آخر نشاط</p>
                <p className="text-xs font-bold text-gray-300">{timeAgo(u.lastActiveAt)}</p>
              </div>

              <div className="text-left flex-shrink-0 hidden sm:block">
                <p className="text-xs text-gray-500">تاريخ التسجيل</p>
                <p className="text-xs font-bold text-gray-300">{formatDateTime(u.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
