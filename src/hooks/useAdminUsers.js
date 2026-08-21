// src/hooks/useAdminUsers.js
import { useState, useEffect, useCallback } from "react";
import { userProfileService } from "../services/userProfileService";

/**
 * عدد إجمالي لحسابات المستخدمين (الشركات) — أدمن بس، الحماية الفعلية في
 * firestore.rules (isAdmin). أي حساب تاني بيستدعي الهوك ده هياخد خطأ
 * permission-denied بدل رقم. عمداً مفيش تفاصيل حسابات هنا (لا اسم ولا
 * إيميل)، الرقم بس.
 */
export const useAdminUsers = () => {
  const [count, setCount]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await userProfileService.getCount();
      setCount(c);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { count, loading, error, reload: load };
};
