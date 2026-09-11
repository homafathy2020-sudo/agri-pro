// src/hooks/useSubscription.js
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { billingService } from "../services/billingService";

/**
 * بيانات subscriptions/{uid} (دورة الفوترة الفعلية شهري/سنوي، آخر
 * دفعة...) — سجل تجاري بس لعرضه في صفحة /billing (مثلاً "شهري" أو
 * "سنوي" جنب اسم الباقة الحالية)، مش مصدر الصلاحيات نفسه (ده
 * useEntitlement). subscription == null طبيعي تمامًا لشركة لسه في
 * التجربة المجانية أو ما اشتركتش في باقة مدفوعة فعلية لسه.
 */
export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setSubscription(null); setLoading(false); return; }
    setLoading(true);
    const unsub = billingService.subscribeToSubscription(
      user.uid,
      (data) => { setSubscription(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [user?.uid]);

  return { subscription, loading };
};
