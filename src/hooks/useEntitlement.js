// src/hooks/useEntitlement.js
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { billingService } from "../services/billingService";
import { computeLicenseState } from "../utils/licenseState";

/**
 * صلاحية الشركة الحالية (باقة/Lifetime/Complimentary) + الحالة المشتقة
 * منها (نشط/فترة سماح/موقوف...). Real-time — أي تفعيل من الأدمن بيبان
 * للشركة فوراً من غير ما تعمل refresh.
 *
 * entitlement == null (وstate == "none") معناه الشركة لسه ما اختارتش
 * باقة خالص — التطبيق مايمنعش حاجة في الحالة دي، بس بيوجّه لصفحة
 * /billing عن طريق البانر.
 */
export const useEntitlement = () => {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) { setEntitlement(null); setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const unsub = billingService.subscribeToEntitlement(
      user.uid,
      (data) => { setEntitlement(data); setLoading(false); },
      (err) => { setError(err); setLoading(false); }
    );
    return unsub;
  }, [user?.uid]);

  const license = computeLicenseState(entitlement);

  /** equipmentCount/teamCount = العدد الحالي (equipment.length / drivers.length
   *  من useEquipment()/useDrivers()) — بيترجع true لو تقدر تضيف واحد جديد. */
  const canAddEquipment = (equipmentCount) => {
    if (!license.canAddRecords) return false;
    const max = license.plan?.limits?.equipmentMax;
    return max == null || equipmentCount < max;
  };

  const canAddTeamMember = (teamCount) => {
    if (!license.canAddRecords) return false;
    const max = license.plan?.limits?.teamMax;
    return max == null || teamCount < max;
  };

  return { entitlement, loading, error, ...license, canAddEquipment, canAddTeamMember };
};
