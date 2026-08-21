// src/pages/AdminPage.jsx
import React from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { Card, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/ui/LoadingScreen";
import { ShieldIcon, UsersGroupIcon, RestoreIcon } from "../components/ui/Icons";

// عمداً بدون أي تفاصيل حسابات (اسم/إيميل/نشاط) — العدد الإجمالي بس.
// حتى الاستعلام نفسه (getCountFromServer) مش بينزّل بيانات أي حساب
// للمتصفح، فمفيش تفاصيل مستخدمين تتسرب حتى لو حد فتح أدوات المطوّر.
const AdminPage = () => {
  const { count, loading, error, reload } = useAdminUsers();

  if (loading) return <LoadingScreen message="جاري تحميل العدد..." />;

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
        <EmptyState
          icon={<ShieldIcon size={48} className="text-red-500 mx-auto mb-2" />}
          title="تعذر تحميل العدد"
          description="تأكد إن الـ UID بتاعك مضاف صح في isAdmin() جوه firestore.rules، وإن الـ rules متنشورة"
          action={<Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload}>إعادة المحاولة</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <ShieldIcon size={22} className="text-brand-400" />
          حسابات الشركات
        </h1>
      </div>

      <Card className="p-8 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-400">
          <UsersGroupIcon size={28} />
        </div>
        <p className="text-4xl font-extrabold text-gray-100">{count}</p>
        <p className="text-sm text-gray-500">إجمالي الحسابات المسجلة</p>
        <Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={reload} className="mt-2">
          تحديث
        </Button>
      </Card>
    </div>
  );
};

export default AdminPage;
