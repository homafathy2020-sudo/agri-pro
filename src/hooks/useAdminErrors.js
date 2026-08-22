// src/hooks/useAdminErrors.js
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { errorLogService } from "../services/errorLogService";

/** سجل الأخطاء — أدمن بس، الحماية الفعلية في firestore.rules (isAdmin). */
export const useAdminErrors = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await errorLogService.getAll();
      setLogs(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleResolved = async (id, current) => {
    // تحديث تفاؤلي (optimistic) عشان الواجهة تحس إنها سريعة، مع رجوع
    // للحالة القديمة لو الكتابة فشلت فعلياً.
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: !current } : l)));
    try {
      await errorLogService.setResolved(id, !current);
    } catch {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: current } : l)));
      toast.error("حصل خطأ، جرّب تاني");
    }
  };

  const removeLog = async (id) => {
    const prevLogs = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await errorLogService.remove(id);
    } catch {
      setLogs(prevLogs);
      toast.error("حصل خطأ، جرّب تاني");
    }
  };

  return { logs, loading, error, reload: load, toggleResolved, removeLog };
};
