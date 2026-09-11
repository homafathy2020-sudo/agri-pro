// src/pages/AdminDataIntegrityPage.jsx
//
// audit finding F-003 (Phase 5) — تقرير فحص تكامل البيانات المجمّع، أدمن
// بس. بيشغّل نفس الفحوصات الموجودة أصلاً لكل شركة لوحدها
// (useNotifications.js: دفعات يتيمة، قيود رواتب مكررة) بس عبر كل الشركات
// المسجّلة دفعة واحدة، عشان الأدمن يقدر يشوف الصورة الكاملة من غير ما
// يفتح حساب كل شركة على حدة. شوف services/adminIntegrityService.js
// للمنطق والتعديل اللي كان لازم يتعمل في firestore.rules عشان ده يبقى
// ممكن أصلاً.
import React, { useState } from "react";
import { useAdminIntegrityReport } from "../hooks/useAdminIntegrityReport";
import { Card, Badge, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { SearchIcon, CheckCircleIcon, AlertIcon, RestoreIcon, ChevronDownIcon, ChevronUpIcon } from "../components/ui/Icons";

const SummaryBadge = ({ label, value, color }) => (
  <div className="bg-surface border border-white/8 rounded-2xl px-4 py-3 flex-1 min-w-[140px]">
    <p className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</p>
    <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
  </div>
);

const CompanyIssueCard = ({ company }) => {
  const [open, setOpen] = useState(false);
  const { orphanedPayments, orphanedSupplierPayments, salaryDuplicates } = company;

  return (
    <Card className="p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 text-right">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-100 truncate">{company.displayName}</p>
          {company.email && <p className="text-xs text-gray-500 truncate" style={{ direction: "ltr", textAlign: "right" }}>{company.email}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="red">{company.issueCount} مشكلة</Badge>
          {open ? <ChevronUpIcon size={16} className="text-gray-500" /> : <ChevronDownIcon size={16} className="text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
          {orphanedPayments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1.5">دفعات بدون عملية مرتبطة ({orphanedPayments.length})</p>
              <div className="space-y-1">
                {orphanedPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-surface-2 rounded-lg px-2.5 py-1.5">
                    <span className="text-gray-400">{p.date || "—"}</span>
                    <span className="text-gray-200 font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orphanedSupplierPayments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1.5">دفعات موردين بدون فاتورة مرتبطة ({orphanedSupplierPayments.length})</p>
              <div className="space-y-1">
                {orphanedSupplierPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-surface-2 rounded-lg px-2.5 py-1.5">
                    <span className="text-gray-400">{p.date || "—"}</span>
                    <span className="text-gray-200 font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salaryDuplicates.duplicateCount > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1.5">
                قيود رواتب مكررة محتملة ({salaryDuplicates.duplicateCount})
                {salaryDuplicates.highConfidence.length > 0 && (
                  <span className="text-red-400"> — {salaryDuplicates.highConfidence.reduce((s, g) => s + g.duplicates.length, 0)} منها شبه مؤكدة</span>
                )}
              </p>
              <p className="text-[11px] text-gray-500">راجعها من صفحة السائق نفسه جوه حساب الشركة دي — التقرير ده للاكتشاف بس، مفيش حذف تلقائي.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const AdminDataIntegrityPage = () => {
  const { report, scanning, progress, error, runScan } = useAdminIntegrityReport();

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
            <SearchIcon size={20} className="text-brand-400" />
            فحص تكامل البيانات
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            دفعات يتيمة وقيود رواتب مكررة محتملة — عبر كل الشركات دفعة واحدة
          </p>
        </div>
        <Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={runScan} disabled={scanning}>
          {scanning ? "جاري الفحص..." : report ? "إعادة الفحص" : "شغّل الفحص"}
        </Button>
      </div>

      {/* الفحص يدوي بالكامل (مفيش استدعاء تلقائي عند فتح الصفحة) لأنه بيقرا
          بيانات كل شركة في النظام دفعة واحدة — تكلفة قراءة حقيقية بتكبر مع
          عدد الشركات، فمينفعش تتحمّل كل مرة الصفحة دي تتفتح. */}
      {!report && !scanning && !error && (
        <EmptyState
          icon={<SearchIcon size={48} className="text-gray-600 mx-auto mb-2" />}
          title="لسه مفيش فحص اتشغّل"
          description="الفحص بيقرا بيانات كل شركة مسجّلة في النظام — دوس على «شغّل الفحص» لما تكون مستعد"
          action={<Button icon={<SearchIcon size={16} />} onClick={runScan}>شغّل الفحص</Button>}
        />
      )}

      {scanning && (
        <Card className="p-5 text-center">
          <p className="text-sm text-gray-300 mb-3">
            {progress.total > 0 ? `جاري فحص ${progress.done} من ${progress.total} شركة...` : "جاري تحميل قائمة الشركات..."}
          </p>
          {progress.total > 0 && (
            <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}
        </Card>
      )}

      {error && (
        <EmptyState
          icon={<AlertIcon size={48} className="text-red-500 mx-auto mb-2" />}
          title="تعذر تشغيل الفحص"
          description="تأكد إن الـ rules الجديدة (صلاحية الأدمن على subcollections) متنشورة على Firebase"
          action={<Button variant="secondary" icon={<RestoreIcon size={16} />} onClick={runScan}>إعادة المحاولة</Button>}
        />
      )}

      {report && !scanning && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <SummaryBadge label="شركة اتفحصت" value={report.companiesScanned} color="text-gray-200" />
            <SummaryBadge label="فيها مشاكل" value={report.companiesWithIssues} color={report.companiesWithIssues > 0 ? "text-amber-400" : "text-green-400"} />
            <SummaryBadge label="إجمالي المشاكل" value={report.totalIssues} color={report.totalIssues > 0 ? "text-red-400" : "text-green-400"} />
          </div>
          <p className="text-xs text-gray-600 mb-4">آخر فحص: {formatDateTime(report.scannedAt)}</p>

          {report.results.length === 0 ? (
            <EmptyState
              icon={<CheckCircleIcon size={48} className="text-green-500 mx-auto mb-2" />}
              title="كل الشركات نضيفة 🎉"
              description="مفيش دفعات يتيمة ولا قيود رواتب مكررة محتملة في أي شركة"
            />
          ) : (
            <div className="space-y-3">
              {report.results.map((company) => (
                <CompanyIssueCard key={company.uid} company={company} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDataIntegrityPage;
