// src/hooks/useAdminUsersPaged.js
//
// audit finding F-019 (Phase 4 roadmap): نسخة مرقّمة الصفحات من قائمة
// الشركات، تستخدم في لوحة الأدمن الرئيسية (AdminPage.jsx) بدل
// useAdminUsers.js — اللي بتجيب كل شركة في النظام دفعة واحدة في كل فتحة
// صفحة، تكلفة كانت بتكبر خطياً مع عدد الشركات (شوف قسم "قابلية التوسّع"
// في تقرير التدقيق: عند 500-1000 شركة، لوحة الأدمن تبقى "غير عملية
// عملياً بدون ترقيم صفحات فعلي").
//
// useAdminUsers.js الأصلية اتسابت زي ما هي بالكامل من غير أي تعديل —
// لسه مستخدمة في AdminMessagesPage.jsx لقائمة اختيار "لمين؟" الشركة
// المستهدفة، واللي محتاجة تشوف كل الشركات فعلاً (ممكن تبعت رسالة لشركة
// رقم 150)، مش صفحة واحدة بس. حاجتين مختلفتين، هوكين مختلفين — بدل ما
// نلعب في سلوك هوك مستخدم في مكان تاني وده ممكن يكسره بصمت.
import { useState, useEffect, useCallback } from "react";
import { userProfileService } from "../services/userProfileService";

export const useAdminUsersPaged = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState(null);
  const [hasMore, setHasMore]       = useState(false);
  const [cursor, setCursor]         = useState(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, nextCursor, hasMore: more } = await userProfileService.getPage({});
      setUsers(items);
      setCursor(nextCursor);
      setHasMore(more);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor, hasMore: more } = await userProfileService.getPage({ cursor });
      setUsers((prev) => [...prev, ...items]);
      setCursor(nextCursor);
      setHasMore(more);
    } catch {
      // best-effort — لو تحميل صفحة إضافية فشل، القائمة الحالية تفضل
      // زي ما هي وتقدر تدوس "تحميل المزيد" تاني.
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);

  return { users, loading, loadingMore, error, hasMore, loadMore, reload: loadFirstPage };
};
