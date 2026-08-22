// src/hooks/useAdminBroadcast.js
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { adminMessageService } from "../services/adminMessageService";

/** إرسال وإدارة تنبيهات الأدمن — أدمن بس (isAdmin في firestore.rules). */
export const useAdminBroadcast = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminMessageService.getAllForAdmin();
      setHistory(data);
    } catch {
      toast.error("تعذر تحميل السجل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async (payload) => {
    setSending(true);
    try {
      await adminMessageService.send(payload);
      toast.success("اتبعتت");
      await load();
      return true;
    } catch {
      toast.error("فشل الإرسال");
      return false;
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    const prev = history;
    setHistory((h) => h.filter((m) => m.id !== id));
    try {
      await adminMessageService.remove(id);
    } catch {
      setHistory(prev);
      toast.error("حصل خطأ، جرّب تاني");
    }
  };

  return { history, loading, sending, send, remove, reload: load };
};
