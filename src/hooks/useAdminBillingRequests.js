// src/hooks/useAdminBillingRequests.js
import { useState, useEffect, useCallback } from "react";
import { billingService } from "../services/billingService";

/**
 * أدمن بس — كل طلبات الدفع اليدوي بكل حالاتها (قيد المراجعة/مؤكدة/
 * مرفوضة)، لصفحة "طلبات الشراء" الكاملة (src/pages/AdminBillingRequestsPage.jsx)
 * — مراقبة شاملة لكل الطلبات زي أي لوحة تحكم متجر، مش بس اللي محتاجة
 * مراجعة دلوقتي. الحماية الفعلية في firestore.rules (isAdmin).
 */
export const useAdminBillingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.getAllBillingRequests();
      setRequests(data);
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

  return { requests, loading, reload: load, confirmRequest, rejectRequest };
};
