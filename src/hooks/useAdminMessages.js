// src/hooks/useAdminMessages.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminMessageService } from "../services/adminMessageService";

// قائمة الرسائل اللي المستخدم "قفلها" (dismissed) متخزنة محلياً على
// الجهاز، مش على Firestore — عشان نتجنب كتابة إضافية لكل مستخدم لكل
// رسالة. التنازل الوحيد: لو المستخدم بدّل جهاز، هيشوف نفس الرسالة تاني
// مرة. مقبول لحجم الاستخدام ده (رسائل قليلة نسبياً، مش يومية).
const dismissedKey = (uid) => `dismissedAdminMsgs:${uid}`;

const loadDismissed = (uid) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(dismissedKey(uid)) || "[]"));
  } catch {
    return new Set();
  }
};

/**
 * تنبيهات الأدمن الموجّهة للمستخدم الحالي — بتتحمّل مرة واحدة عند فتح
 * التطبيق (مش listener لايف، الرسائل دي مش متكررة كفاية تستاهل اتصال
 * مستمر). لو عايز تحدثها فوراً استخدم reload().
 */
export const useAdminMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    try {
      const all = await adminMessageService.getForUser(user.uid);
      const dismissed = loadDismissed(user.uid);
      setMessages(all.filter((m) => !dismissed.has(m.id)));
    } catch {
      setMessages([]); // best-effort — لو فشلت، صفحة التنبيهات تفضل شغالة بباقي المصادر
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const dismiss = (id) => {
    if (!user) return;
    const dismissed = loadDismissed(user.uid);
    dismissed.add(id);
    localStorage.setItem(dismissedKey(user.uid), JSON.stringify([...dismissed]));
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return { messages, loading, dismiss, reload: load };
};
