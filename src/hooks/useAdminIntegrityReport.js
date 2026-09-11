// src/hooks/useAdminIntegrityReport.js
//
// audit finding F-003 (Phase 5) — تقرير فحص تكامل البيانات المجمّع (أدمن
// بس). شوف services/adminIntegrityService.js للمنطق الفعلي وللتعديل في
// firestore.rules اللي كان لازم يتعمل عشان الأدمن يقدر يقرا بيانات
// الشركات أصلاً.
import { useState, useCallback } from "react";
import { adminIntegrityService } from "../services/adminIntegrityService";

export const useAdminIntegrityReport = () => {
  const [report, setReport]     = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError]       = useState(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setProgress({ done: 0, total: 0 });
    try {
      const result = await adminIntegrityService.runFullScan((done, total) =>
        setProgress({ done, total })
      );
      setReport(result);
    } catch (err) {
      setError(err);
    } finally {
      setScanning(false);
    }
  }, []);

  return { report, scanning, progress, error, runScan };
};
