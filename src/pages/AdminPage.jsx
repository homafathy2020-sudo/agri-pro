// src/pages/AdminPage.jsx
import React, { useMemo, useState } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { Card, EmptyState, Badge } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import LoadingScreen from "../components/ui/LoadingScreen";
import { formatDateTime } from "../utils/formatters";
import {
  ShieldIcon, UsersGroupIcon, RestoreIcon, ClearIcon,
} from "../components/ui/Icons";

const SearchIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

// حساب بيتعتبر "نشط" لو آخر نشاط ليه خلال آخر 30 يوم (lastActiveAt بيتحدّث
// كل 6 ساعات كحد أقصى وقت الاستخدام الفعلي — راجع AuthContext).
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const isActive = (lastActiveAt) => {
  const d = typeof lastActiveAt?.toDate === "function" ? lastActiveAt.toDate() : lastActiveAt ? new Date(lastActiveAt) : null;
  if (!d || isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= ACTIVE_WINDOW_MS;
};

const AdminPage = () => {
  const { users, count, loading, error, reload } = useAdminUsers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  if (loading) return <LoadingScreen message="جاري تحميل الحسابات..." />;

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
        <EmptyState
          icon={<ShieldIcon size={48} className="text-red-500 mx-auto mb-2" />}
          title="تعذر تحميل الحسابات"
          description="تأكد إن الـ UID بتاعك مضاف صح في isAdmin() جوه firestore.rules، وإن الـ rules متنشورة"
          action={<Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload}>إعادة المحاولة</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <ShieldIcon size={22} className="text-brand-400" />
          حسابات الشركات
        </h1>
        <Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload}>
          تحديث
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-4 flex-wrap">
        <Card className="px-5 py-3 flex items-center gap-3">
          <UsersGroupIcon size={20} className="text-brand-400" />
          <div>
            <p className="text-lg font-extrabold text-gray-100 leading-none">{count}</p>
            <p className="text-xs text-gray-500 mt-1">إجمالي الحسابات</p>
          </div>
        </Card>

        <div className="flex-1 min-w-[220px] relative">
          <span className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 pointer-events-none">
            <SearchIcon />
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الإيميل..."
            className="pr-10 pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 left-3 flex items-center text-gray-500 hover:text-gray-300"
              aria-label="مسح البحث"
            >
              <ClearIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UsersGroupIcon size={40} className="text-gray-600 mx-auto mb-2" />}
          title={query ? "مفيش نتائج" : "مفيش حسابات لسه"}
          description={query ? "جرّب كلمة بحث تانية" : ""}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs">
                <th className="text-right font-semibold px-4 py-3">الاسم</th>
                <th className="text-right font-semibold px-4 py-3">الإيميل</th>
                <th className="text-right font-semibold px-4 py-3">حالة النشاط</th>
                <th className="text-right font-semibold px-4 py-3">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-gray-100 font-semibold whitespace-nowrap">
                    {u.displayName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap" dir="ltr">
                    {u.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isActive(u.lastActiveAt) ? (
                      <Badge variant="green">نشط</Badge>
                    ) : (
                      <Badge variant="gray">غير نشط</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDateTime(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default AdminPage;
