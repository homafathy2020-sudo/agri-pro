// src/hooks/useAdminUsers.js
import { useState, useEffect, useCallback } from "react";
import { userProfileService } from "../services/userProfileService";

/**
 * قائمة حسابات المستخدمين (الشركات) — أدمن بس، الحماية الفعلية في
 * firestore.rules (isAdmin + allow list). أي حساب تاني بيستدعي الهوك ده
 * هياخد خطأ permission-denied بدل البيانات.
 */
export const useAdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await userProfileService.getAll();
      setUsers(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, count: users.length, loading, error, reload: load };
};
