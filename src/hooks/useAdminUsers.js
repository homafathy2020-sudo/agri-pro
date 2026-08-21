// src/hooks/useAdminUsers.js
import { useState, useEffect, useCallback } from "react";
import { userProfileService } from "../services/userProfileService";

/**
 * قائمة كل حسابات المستخدمين (الشركات) — أدمن بس، الحماية الفعلية في
 * firestore.rules (isAdmin). أي حساب تاني بيستدعي الهوك ده هياخد خطأ
 * permission-denied بدل بيانات.
 */
export const useAdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userProfileService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, loading, error, reload: load };
};
