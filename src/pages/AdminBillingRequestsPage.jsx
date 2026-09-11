// src/pages/AdminBillingRequestsPage.jsx
// ─────────────────────────────────────────────────────────
// صفحة أدمن كاملة لمراقبة طلبات الشراء (الدفع اليدوي: فودافون كاش/
// InstaPay) — زي أي لوحة تحكم "طلبات" في متجر: كل الطلبات بكل حالاتها
// (قيد المراجعة/مؤكدة/مرفوضة)، فلترة وبحث، وتأكيد/رفض مباشر من هنا.
// التفعيل الفعلي (كتابة subscriptions/entitlements) بيحصل عن طريق
// billingService.confirmBillingRequestAndActivate — نفس المنطق
// المستخدم من قبل، هنا بس واجهة مخصصة وأشمل لمراقبة كل الطلبات مش بس
// اللي لسه محتاجة مراجعة.
// ─────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAdminBillingRequests } from "../hooks/useAdminBillingRequests";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useConfirm } from "../hooks/useConfirm";
import { Card, EmptyState, Badge } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import LoadingScreen from "../components/ui/LoadingScreen";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { getPlanById, METHOD_LABELS_AR, BILLING_REQUEST_STATUS } from "../config/constants/billing";
import { formatDateTime, formatCurrency } from "../utils/formatters";
import { WalletIcon, CheckCircleIcon, XCircleIcon, ClearIcon, ChevronLeftIcon } from "../components/ui/Icons";

const STATUS_LABELS = {
  [BILLING_REQUEST_STATUS.PENDING_REVIEW]: { text: "قيد المراجعة", variant: "amber" },
  [BILLING_REQUEST_STATUS.CONFIRMED]:      { text: "مؤكدة",         variant: "green" },
  [BILLING_REQUEST_STATUS.REJECTED]:       { text: "مرفوضة",        variant: "red" },
};

const FILTERS = [
  { key: "all",                               label: "الكل" },
  { key: BILLING_REQUEST_STATUS.PENDING_REVIEW, label: "قيد المراجعة" },
  { key: BILLING_REQUEST_STATUS.CONFIRMED,      label: "مؤكدة" },
  { key: BILLING_REQUEST_STATUS.REJECTED,       label: "مرفوضة" },
];

// نافذة رفض صغيرة — سبب الرفض اختياري وبيتسجل مع الطلب كملاحظة داخلية،
// مش بيتبعت للشركة تلقائيًا (التواصل معاها لسه بيحصل يدويًا على واتساب).
const RejectModal = ({ request, onClose, onReject }) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReject = async () => {
    setSaving(true);
    try {
      await onReject(request.id, reason.trim());
      toast.success("تم رفض الطلب");
      onClose();
    } catch {
      toast.error("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="رفض طلب الدفع" size="sm">
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        سبب الرفض (اختياري) — هيتسجل مع الطلب كملاحظة داخلية.
      </p>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="مثال: المبلغ المحوّل أقل من المطلوب..."
      />
      <div className="flex gap-3 justify-end mt-5">
        <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>تراجع</Button>
        <Button variant="danger" size="sm" loading={saving} onClick={handleReject}>تأكيد الرفض</Button>
      </div>
    </Modal>
  );
};

const AdminBillingRequestsPage = () => {
  const { requests, loading, confirmRequest, rejectRequest } = useAdminBillingRequests();
  const { users } = useAdminUsers();
  const { confirm, confirmState } = useConfirm();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);

  const usersByUid = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.uid] = u; });
    return map;
  }, [users]);

  const counts = useMemo(() => {
    const c = {
      all: requests.length,
      [BILLING_REQUEST_STATUS.PENDING_REVIEW]: 0,
      [BILLING_REQUEST_STATUS.CONFIRMED]: 0,
      [BILLING_REQUEST_STATUS.REJECTED]: 0,
    };
    requests.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      const requester = usersByUid[r.uid];
      return (requester?.displayName || "").toLowerCase().includes(q)
        || (requester?.email || "").toLowerCase().includes(q);
    });
  }, [requests, filter, query, usersByUid]);

  const handleConfirm = async (req) => {
    const requester = usersByUid[req.uid];
    const plan = getPlanById(req.planId);
    const ok = await confirm(
      req.id,
      `تفعيل باقة "${plan?.name || req.planId}" لـ${requester?.displayName || requester?.email || "الشركة"} بعد التأكد من وصول التحويل؟`
    );
    if (!ok) return;
    try {
      await confirmRequest(req);
      toast.success("تم تفعيل الاشتراك");
    } catch {
      toast.error("حصل خطأ، حاول تاني");
    }
  };

  if (loading) return <LoadingScreen message="جاري تحميل طلبات الشراء..." />;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-2"
        >
          <ChevronLeftIcon size={14} className="rotate-180" /> رجوع لحسابات الشركات
        </button>
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <WalletIcon size={22} className="text-brand-400" />
          طلبات الشراء
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          كل طلبات الدفع اليدوي (فودافون كاش/InstaPay) — مراجعة وتفعيل مباشر
        </p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl border transition-colors ${
              filter === f.key
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-surface-2 border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            {f.label}
            <span className={`text-[11px] rounded-full px-1.5 ${filter === f.key ? "bg-white/20" : "bg-white/10"}`}>
              {counts[f.key] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-5 relative max-w-sm">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الإيميل..."
          className="pl-9"
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={40} className="text-gray-600 mx-auto mb-2" />}
          title="مفيش طلبات"
          description={filter !== "all" || query ? "جرّب فلتر أو بحث تاني" : "لسه مفيش أي طلبات دفع اتسجلت"}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => {
            const requester = usersByUid[req.uid];
            const plan = getPlanById(req.planId);
            const statusInfo = STATUS_LABELS[req.status] || { text: req.status, variant: "gray" };
            const isPending = req.status === BILLING_REQUEST_STATUS.PENDING_REVIEW;
            return (
              <Card key={req.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-100 font-bold text-sm">
                        {requester?.displayName || requester?.email || req.uid}
                      </span>
                      <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                    </div>
                    <p className="text-xs text-gray-500" dir="ltr">{requester?.email}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      باقة <span className="text-gray-200 font-semibold">{plan?.name || req.planId}</span>
                      {" "}({req.billingCycle === "annual" ? "سنوي" : "شهري"}) — {formatCurrency(req.amount)} عبر {METHOD_LABELS_AR[req.method] || req.method}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      اتبعت {formatDateTime(req.createdAt)}
                      {req.status === BILLING_REQUEST_STATUS.CONFIRMED && req.confirmedAt && ` · اتفعّل ${formatDateTime(req.confirmedAt)}`}
                    </p>
                    {req.status === BILLING_REQUEST_STATUS.REJECTED && req.rejectReason && (
                      <p className="text-xs text-red-400 mt-1">سبب الرفض: {req.rejectReason}</p>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="danger" size="sm" icon={<XCircleIcon size={14} />} onClick={() => setRejectTarget(req)}>
                        رفض
                      </Button>
                      <Button variant="primary" size="sm" icon={<CheckCircleIcon size={14} />} onClick={() => handleConfirm(req)}>
                        تأكيد وتفعيل
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={rejectRequest}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        onClose={confirmState.reject}
        onConfirm={confirmState.accept}
        title="تأكيد تفعيل الاشتراك"
        message={confirmState.message}
        confirmLabel="تأكيد التفعيل"
        confirmIcon={<CheckCircleIcon size={14} />}
        confirmVariant="primary"
      />
    </div>
  );
};

export default AdminBillingRequestsPage;
