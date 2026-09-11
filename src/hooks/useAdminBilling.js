// src/hooks/useAdminBilling.js
import { useState, useEffect, useCallback } from "react";
import { billingService } from "../services/billingService";

/**
 * أدمن بس — الحماية الفعلية في firestore.rules (isAdmin). بيجيب كل
 * entitlements الشركات (لعمود "الباقة/الحالة")، وطلبات الدفع المعلّقة
 * (لقسم "طلبات محتاجة مراجعة").
 */
export const useAdminBilling = () => {
  const [entitlements, setEntitlements] = useState({}); // { [uid]: data }
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ent, pending] = await Promise.all([
        billingService.getAllEntitlements(),
        billingService.getPendingBillingRequests(),
      ]);
      setEntitlements(ent);
      setPendingRequests(pending);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmRequest = async (request) => {
    await billingService.confirmBillingRequestAndActivate(request);
    await load();
  };

  const rejectRequest = async (requestId, reason) => {
    await billingService.rejectBillingRequest(requestId, reason);
    await load();
  };

  const grantEntitlement = async (payload) => {
    await billingService.grantEntitlement(payload);
    await load();
  };

  const extendEntitlement = async (uid, days) => {
    await billingService.extendEntitlement(uid, days);
    await load();
  };

  return {
    entitlements, pendingRequests, loading, reload: load,
    confirmRequest, rejectRequest, grantEntitlement, extendEntitlement,
  };
};
