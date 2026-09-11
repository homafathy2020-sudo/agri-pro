// src/contexts/data/migrations.js
//
// الـ migrations التلقائية اللمرة-الواحدة (driverCosts → salaryEntries،
// وتثبيت fuelPriceAtJob على العمليات القديمة) — منقولة هنا حرفيًا من
// DataContext.jsx (كانت جوه الـ load effect مباشرة)، بنفس الشروط ونفس
// الترتيب بالظبط، من غير أي تغيير في السلوك. استُدعيت من useDataLoader.js.
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase";
import { driverCostService } from "../../services/driverCostService";
import { salaryService } from "../../services/salaryService";
import { driverCostToSalaryEntry } from "../../utils/migrateDriverCosts";
import { DEFAULT_FUEL_PRICE } from "../../config/constants";

// Local (per-device), safe flag: only ever set *after* a successful read
// has confirmed the legacy `driverCosts` collection is fully drained. Its
// sole purpose is to skip re-fetching that collection on every future app
// load once there is nothing left in it to migrate.
export const driverCostsMigratedKey = (uid) => `driverCostsMigrated:${uid}`;
// One-time backfill flag: freezes fuelPriceAtJob on jobs saved before that
// field existed.
export const fuelPriceMigratedKey = (uid) => `fuelPriceBackfilled:${uid}`;

// One-time merge: fold any leftover legacy driverCosts docs into
// salaryEntries, then remove the legacy docs so this only runs once.
// Only attempted when both collections actually loaded — merging against a
// failed (and therefore unknown) salaryEntries list could duplicate
// entries next time the real data loads.
//
// migratingRef: نفس الـ ref (useRef(false)) اللي كان بيمنع تشغيل الـ
// migration مرتين في نفس الوقت لو حصل load متزامن (اتنين tabs، أو retry
// أثناء load سابق لسه شغال).
export async function runDriverCostsMigration({
  userId, driverCostsR, salaryEntriesR, migratingRef,
}) {
  let mergedSalaryEntries = salaryEntriesR.ok ? salaryEntriesR.data : undefined;
  let migrationSucceededThisRound = false;
  let migratedCount = 0;

  if (
    driverCostsR.ok && salaryEntriesR.ok &&
    driverCostsR.data.length > 0 && !migratingRef.current
  ) {
    migratingRef.current = true;
    try {
      // Idempotency guard: if a driverCost doc's own delete failed after
      // its salaryEntry was already created, it lingers and would
      // otherwise be migrated again next load — creating a duplicate
      // salaryEntry. Detect "already migrated" via the legacy record's own
      // id, stamped on the salaryEntry it produced (legacyDriverCostId).
      const alreadyMigratedIds = new Set(
        salaryEntriesR.data.map((e) => e.legacyDriverCostId).filter(Boolean)
      );
      const migrated = (
        await Promise.all(
          driverCostsR.data.map(async (cost) => {
            if (alreadyMigratedIds.has(cost.id)) {
              // Its salaryEntry already exists — just finish removing this
              // leftover legacy doc, don't create another one.
              await driverCostService.remove(userId, cost.id);
              return null;
            }
            const payload = driverCostToSalaryEntry(cost);
            const { id, promise } = salaryService.add(userId, payload);
            await promise;
            await driverCostService.remove(userId, cost.id);
            return { id, ...payload };
          })
        )
      ).filter(Boolean);
      // Reaching this point means every item in driverCostsR.data was
      // either already-migrated-and-removed or just migrated and removed
      // above, with nothing throwing along the way.
      migrationSucceededThisRound = true;
      migratedCount = migrated.length;
      if (migrated.length > 0) {
        mergedSalaryEntries = [...migrated, ...salaryEntriesR.data];
      }
    } catch (migrateErr) {
      // Non-fatal — leave legacy docs in place, try again next load.
      console.warn("driverCosts migration failed:", migrateErr);
    } finally {
      migratingRef.current = false;
    }
  }

  return { mergedSalaryEntries, migrationSucceededThisRound, migratedCount };
}

// One-time backfill: stamp fuelPriceAtJob onto any job saved before that
// field existed, using the current settings price as the anchor. Only
// attempted when both jobs and settings actually loaded.
export async function runFuelPriceBackfill({
  userId, jobsR, settingsR, migratingRef,
}) {
  let mergedJobs = jobsR.ok ? jobsR.data : undefined;
  let succeeded = false;

  if (jobsR.ok && settingsR.ok && !migratingRef.current) {
    migratingRef.current = true;
    try {
      const currentFuelPrice = settingsR.data.fuelPrice ?? DEFAULT_FUEL_PRICE;
      const legacyJobs = jobsR.data.filter(
        (j) => j.fuelPriceAtJob === undefined || j.fuelPriceAtJob === null
      );
      if (legacyJobs.length > 0) {
        const batch = writeBatch(db);
        legacyJobs.forEach((j) => {
          batch.update(doc(db, "users", userId, "jobs", j.id), {
            fuelPriceAtJob: currentFuelPrice,
          });
        });
        await batch.commit();
        const stampedIds = new Set(legacyJobs.map((j) => j.id));
        mergedJobs = jobsR.data.map((j) =>
          stampedIds.has(j.id) ? { ...j, fuelPriceAtJob: currentFuelPrice } : j
        );
      }
      succeeded = true;
    } catch (backfillErr) {
      // Non-fatal — legacy jobs just keep tracking the settings price
      // until the next load tries again.
      console.warn("fuelPriceAtJob backfill failed:", backfillErr);
    } finally {
      migratingRef.current = false;
    }
  }

  return { mergedJobs, succeeded };
}
