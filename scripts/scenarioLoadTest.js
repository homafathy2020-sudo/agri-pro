// scripts/scenarioLoadTest.js
//
// سيناريو أقرب للواقع من concurrentLoadTest.js: مش بس "كل الشركات بتفتح
// البرنامج مع بعض"، لكن بعد ما يفتحوا (ويفضلوا فاتحين — زي التاب مقفول
// مش قافل)، شركتين بيعدّلوا في عملية شغل، شركة بتحذف عملية (ومعاها
// الدفعات المرتبطة بيها، بالظبط زي ما بتعمل الشاشة الحقيقية)، وشركة
// بتضيف عملية شغل جديدة — كل ده في نفس اللحظة تقريبًا، والباقي فاتحين
// بس من غير ما يعملوا حاجة (زي مستخدم سايب التاب مفتوح).
//
// اللي بيتقاسه هنا (غير الأداء): هل التعديل/الحذف/الإضافة بتوصل صح
// وبسرعة لنفس الشركة اللي عملتها (عن طريق الـ listener الحي، بالظبط زي
// ما التطبيق بيشتغل)، وهل باقي الشركات التمانية اللي مش بتعمل حاجة
// فضلوا **من غير ما تتلمس بياناتهم خالص** — ده أهم جزء: التأكد إن مفيش
// أي تسريب أو تداخل بين شركة وشركة تانية حتى لما فيه كتابة شغالة فعليًا
// في نفس اللحظة على شركات تانية.
//
// ============================================================================
// السكريبت ده بيعمل كتابة حقيقية (تعديل/حذف/إضافة) — بس بس بس على
// الشركات التجريبية (loadtest-co-XX) وعلى مشروع my-app-load-test بس (بيتأكد
// من projectId الأول). مفيش أي لمسة لأي بيانات تانية أو مشروع تاني.
// ============================================================================
//
// طريقة التشغيل (لازم الشركات تكون اتزرعت الأول بـ seedLoadTestCompanies.js):
//   node scripts/scenarioLoadTest.js [عدد الشركات=10] [باسورد]
//
// توزيع الأدوار (ثابت، مش عشوائي، عشان تقدر تتابعه بسهولة):
//   شركة 1، 2  → بتعدّل في عملية شغل موجودة عندها
//   شركة 3     → بتحذف عملية شغل (ومعاها الدفعات المرتبطة بيها)
//   شركة 4     → بتضيف عملية شغل جديدة
//   باقي الشركات (5 لحد آخر واحدة) → فاتحين البرنامج بس، من غير أي كتابة

const fs = require("fs");
const path = require("path");

const COMPANY_COUNT = Math.max(1, Number(process.argv[2]) || 10);
const PASSWORD = process.argv[3] || "LoadTest@2026";
const FIREBASE_JS_PATH = process.argv[4] || path.resolve(__dirname, "../src/config/firebase.js");
const EMAIL_DOMAIN = "agripro-test.local";
const LOAD_TIMEOUT_MS = 30000;
const SETTLE_WAIT_MS = 6000; // وقت ننتظره بعد الكتابات قبل ما نتأكد من النتيجة النهائية

function loadFirebaseConfig() {
  const src = fs.readFileSync(FIREBASE_JS_PATH, "utf8");
  const match = src.match(/const\s+firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
  if (!match) throw new Error(`ماقدرتش ألاقي firebaseConfig جوه ${FIREBASE_JS_PATH}`);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${match[1]};`)();
}

const { initializeApp, deleteApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const {
  getFirestore, collection, doc, query, where, orderBy, onSnapshot,
  getDocs, setDoc, updateDoc, writeBatch, serverTimestamp,
} = require("firebase/firestore");

const firebaseConfig = loadFirebaseConfig();
if (firebaseConfig.projectId !== "my-app-load-test") {
  console.error(
    `❌ الإعدادات دي بتاعة مشروع "${firebaseConfig.projectId}"، مش "my-app-load-test". ` +
    `السكريبت ده اتعمل يشتغل بس على المشروع التجريبي — وقف هنا عشان الأمان.`
  );
  process.exit(1);
}
if (COMPANY_COUNT < 4) {
  console.error("محتاج 4 شركات على الأقل عشان السيناريو (اتنين تعديل + واحد حذف + واحد إضافة).");
  process.exit(1);
}

const COLLECTIONS = [
  { key: "equipment",       orderByField: "createdAt" },
  { key: "jobs",             orderByField: "date" },
  { key: "drivers",          orderByField: "createdAt" },
  { key: "maintenance",      orderByField: "date" },
  { key: "payments",         orderByField: null },
  { key: "supplierInvoices", orderByField: "date" },
  { key: "supplierPayments", orderByField: null },
  { key: "salaryEntries",    orderByField: null },
  { key: "attendance",       orderByField: null },
  { key: "custodyTransactions", orderByField: null },
  { key: "taxDeductions",    orderByField: null },
];

function roleFor(index) {
  if (index === 1 || index === 2) return "edit";
  if (index === 3) return "delete";
  if (index === 4) return "add";
  return "idle";
}
const ROLE_LABELS_AR = {
  edit: "بتعدّل في عملية موجودة",
  delete: "بتحذف عملية (ومعاها دفعاتها)",
  add: "بتضيف عملية جديدة",
  idle: "فاتحة بس، من غير أي كتابة",
};

// عملية ثابتة نعدّل/نمسح فيها عند كل شركة عندها الدور ده — رقمها موجود
// أكيد لأن seedLoadTestCompanies.js بيعمل 180 عملية لكل شركة (001..180).
const TARGET_JOB_SUFFIX = "090";

function setupCompany(index) {
  const tag = String(index).padStart(2, "0");
  const email = `loadtest-co-${tag}@${EMAIL_DOMAIN}`;
  const appName = `scenario-app-${tag}`;
  const role = roleFor(index);

  const state = {
    email, tag, role, ok: false, error: null,
    uid: null, appInst: null,
    live: {}, // key -> آخر مصفوفة مستندات معروفة لهذه المجموعة
    pendingWaiters: {}, // key -> [resolve, ...] بتتنادى أول ما يجيلها تحديث جديد
    unsubscribes: [],
  };

  state.onNextUpdate = (key) => new Promise((resolve) => {
    (state.pendingWaiters[key] = state.pendingWaiters[key] || []).push(resolve);
  });

  return state;
}

function loadCompanyInitial(state) {
  return new Promise((resolve, reject) => {
    const remaining = new Set([...COLLECTIONS.map((c) => c.key), "settings"]);
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Timeout بعد ${LOAD_TIMEOUT_MS}ms أثناء التحميل الأولي — لسه مستني: ${[...remaining].join(", ")}`));
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        state.appInst = initializeApp(firebaseConfig, `scenario-app-${state.tag}`);
        const authInst = getAuth(state.appInst);
        const dbInst = getFirestore(state.appInst);
        state.db = dbInst;

        const cred = await signInWithEmailAndPassword(authInst, state.email, PASSWORD);
        state.uid = cred.user.uid;

        const notifyUpdate = (key) => {
          const waiters = state.pendingWaiters[key];
          if (waiters && waiters.length) {
            state.pendingWaiters[key] = [];
            waiters.forEach((r) => r(state.live[key]));
          }
        };

        COLLECTIONS.forEach(({ key, orderByField }) => {
          const colRef = collection(dbInst, "users", state.uid, key);
          const q = orderByField ? query(colRef, orderBy(orderByField, "desc")) : colRef;
          const unsub = onSnapshot(
            q,
            (snap) => {
              state.live[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              const wasFirst = remaining.delete(key);
              if (!wasFirst) notifyUpdate(key); // مش أول مرة → ده تحديث حقيقي بعد الكتابة
              checkDone();
            },
            (err) => { clearTimeout(timeoutHandle); reject(err); }
          );
          state.unsubscribes.push(unsub);
        });

        const settingsRef = doc(dbInst, "users", state.uid, "meta", "settings");
        const unsubSettings = onSnapshot(
          settingsRef,
          () => { remaining.delete("settings"); checkDone(); },
          (err) => { clearTimeout(timeoutHandle); reject(err); }
        );
        state.unsubscribes.push(unsubSettings);

        function checkDone() {
          if (remaining.size === 0) {
            clearTimeout(timeoutHandle);
            state.ok = true;
            resolve();
          }
        }
      } catch (err) {
        clearTimeout(timeoutHandle);
        reject(err);
      }
    })();
  });
}

async function performEdit(state) {
  const jobId = `lt${state.tag}-job-${TARGET_JOB_SUFFIX}`;
  const before = (state.live.jobs || []).find((j) => j.id === jobId);
  if (!before) throw new Error(`العملية ${jobId} مش موجودة أصلاً — الزرع لسه ماخلصش لشركة دي؟`);

  const start = Date.now();
  const waiter = state.onNextUpdate("jobs");
  await updateDoc(doc(state.db, "users", state.uid, "jobs", jobId), {
    acres: (before.acres || 0) + 3,
    notes: "تعديل اختباري متزامن (scenarioLoadTest)",
    updatedAt: serverTimestamp(),
  });
  await waiter; // نستنى لحد ما الـ listener بتاعنا يشوف التعديل فعلاً
  return { jobId, ms: Date.now() - start, before, expectedAcres: (before.acres || 0) + 3 };
}

async function performDelete(state) {
  const jobId = `lt${state.tag}-job-${TARGET_JOB_SUFFIX}`;
  const before = (state.live.jobs || []).find((j) => j.id === jobId);
  if (!before) throw new Error(`العملية ${jobId} مش موجودة أصلاً — الزرع لسه ماخلصش لشركة دي؟`);
  const relatedPaymentsBefore = (state.live.payments || []).filter((p) => p.jobId === jobId);

  const start = Date.now();
  const jobsWaiter = state.onNextUpdate("jobs");
  const paymentsWaiter = relatedPaymentsBefore.length > 0 ? state.onNextUpdate("payments") : Promise.resolve();

  const paymentsSnap = await getDocs(
    query(collection(state.db, "users", state.uid, "payments"), where("jobId", "==", jobId))
  );
  const batch = writeBatch(state.db);
  paymentsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(state.db, "users", state.uid, "jobs", jobId));
  await batch.commit();

  await Promise.all([jobsWaiter, paymentsWaiter]);
  return { jobId, ms: Date.now() - start, deletedPayments: relatedPaymentsBefore.length };
}

async function performAdd(state) {
  const equipmentId = (state.live.equipment || [])[0]?.id;
  const driverId = (state.live.drivers || [])[0]?.id;
  if (!equipmentId || !driverId) throw new Error("مفيش معدات/سائقين عند الشركة دي عشان نضيف عملية جديدة");

  const start = Date.now();
  const waiter = state.onNextUpdate("jobs");
  const ref = doc(collection(state.db, "users", state.uid, "jobs"));
  await setDoc(ref, {
    equipmentId, driverId, client: "عميل اختبار السيناريو المتزامن",
    workType: "المحراث", acres: 9, pricePerAcre: 250, fuelUsed: 40,
    date: new Date().toISOString().split("T")[0], notes: "عملية اختبارية (scenarioLoadTest)",
    amountPaid: 0, createdAt: new Date().toISOString(), updatedAt: serverTimestamp(),
  });
  await waiter;
  return { jobId: ref.id, ms: Date.now() - start };
}

async function main() {
  console.log(`جاري تجهيز سيناريو مختلط على ${COMPANY_COUNT} شركة (my-app-load-test)...\n`);
  console.log("توزيع الأدوار:");
  for (let i = 1; i <= COMPANY_COUNT; i++) {
    console.log(`  شركة ${String(i).padStart(2, "0")} — ${ROLE_LABELS_AR[roleFor(i)]}`);
  }
  console.log("");

  const companies = Array.from({ length: COMPANY_COUNT }, (_, i) => setupCompany(i + 1));

  console.log("جاري فتح البرنامج لكل الشركات مع بعض (زي ما لو كل واحدة فاتحة تاب)...");
  const loadStart = Date.now();
  const loadResults = await Promise.allSettled(companies.map((c) => loadCompanyInitial(c)));
  console.log(`كل الشركات فتحت بياناتها الأولية خلال ${Date.now() - loadStart}ms.\n`);

  const failedToLoad = companies.filter((c, i) => loadResults[i].status === "rejected");
  failedToLoad.forEach((c, i) => console.log(`⚠️ ${c.email} فشلت في التحميل الأولي: ${loadResults[i].reason?.message}`));
  if (failedToLoad.length === companies.length) {
    console.error("كل الشركات فشلت في التحميل — واقف هنا.");
    process.exit(1);
  }

  console.log("جاري تنفيذ العمليات المتزامنة (تعديل/حذف/إضافة) دلوقتي...\n");
  const opResults = await Promise.allSettled(companies.map(async (c) => {
    if (!c.ok) return { skipped: true };
    if (c.role === "edit") return { role: "edit", result: await performEdit(c) };
    if (c.role === "delete") return { role: "delete", result: await performDelete(c) };
    if (c.role === "add") return { role: "add", result: await performAdd(c) };
    return { role: "idle" };
  }));

  console.log(`منتظرين ${SETTLE_WAIT_MS / 1000} ثانية عشان أي تحديثات متأخرة تستقر...\n`);
  await new Promise((r) => setTimeout(r, SETTLE_WAIT_MS));

  console.log("──────────────── نتيجة العمليات ────────────────");
  companies.forEach((c, i) => {
    const r = opResults[i];
    if (r.status === "rejected") {
      console.log(`❌ ${c.email} (${ROLE_LABELS_AR[c.role]}) — فشلت: ${r.reason?.message}`);
      return;
    }
    const v = r.value;
    if (v.skipped) { console.log(`⏭️  ${c.email} — اتخطّيت (فشل التحميل الأولي)`); return; }
    if (v.role === "idle") { console.log(`💤 ${c.email} — فاتحة وساكنة، زي المتوقع`); return; }
    if (v.role === "edit") {
      console.log(`✏️  ${c.email} — عدّلت ${v.result.jobId} (acres: ${v.result.before.acres} → ${v.result.expectedAcres}) في ${v.result.ms}ms`);
    } else if (v.role === "delete") {
      console.log(`🗑️  ${c.email} — حذفت ${v.result.jobId} و${v.result.deletedPayments} دفعة مرتبطة في ${v.result.ms}ms`);
    } else if (v.role === "add") {
      console.log(`➕ ${c.email} — أضافت عملية جديدة (${v.result.jobId}) في ${v.result.ms}ms`);
    }
  });

  console.log("\n──────────────── فحص السلامة النهائي (لكل الشركات) ────────────────");
  let allGood = true;
  companies.forEach((c) => {
    if (!c.ok) return;
    const jobs = c.live.jobs || [];
    const payments = c.live.payments || [];
    const problems = [];

    if (c.role === "idle" || c.role === "edit") {
      if (jobs.length !== 180) problems.push(`عدد العمليات ${jobs.length} (المتوقع 180 — أي تغيير هنا معناه تسريب من شركة تانية أو خلل)`);
    }
    if (c.role === "delete" && jobs.length !== 179) {
      problems.push(`عدد العمليات ${jobs.length} بعد الحذف (المتوقع 179)`);
    }
    if (c.role === "add" && jobs.length !== 181) {
      problems.push(`عدد العمليات ${jobs.length} بعد الإضافة (المتوقع 181)`);
    }
    if (c.role === "edit") {
      const jobId = `lt${c.tag}-job-${TARGET_JOB_SUFFIX}`;
      const job = jobs.find((j) => j.id === jobId);
      if (!job || job.notes !== "تعديل اختباري متزامن (scenarioLoadTest)") {
        problems.push(`التعديل على ${jobId} مش ظاهر في آخر نسخة من البيانات`);
      }
    }
    const jobIds = new Set(jobs.map((j) => j.id));
    const orphanPayments = payments.filter((p) => !jobIds.has(p.jobId));
    if (orphanPayments.length > 0) problems.push(`${orphanPayments.length} دفعة يتيمة (مرتبطة بعملية اتمسحت أو مش موجودة)`);

    if (problems.length > 0) {
      allGood = false;
      console.log(`🚨 ${c.email} (${ROLE_LABELS_AR[c.role]}):`);
      problems.forEach((p) => console.log(`      • ${p}`));
    } else {
      console.log(`✅ ${c.email} (${ROLE_LABELS_AR[c.role]}) — كل حاجة صح.`);
    }
  });

  companies.forEach((c) => c.unsubscribes.forEach((u) => { try { u(); } catch (_) {} }));
  await Promise.all(companies.map((c) => (c.appInst ? deleteApp(c.appInst).catch(() => {}) : null)));

  console.log(allGood
    ? "\n✅ السيناريو كله عدّى صح — الكتابة والتعديل والحذف في شركات معيّنة ماأثّرتش خالص على باقي الشركات."
    : "\n🚨 فيه مشاكل ظهرت فوق — راجعها قبل أي خطوة تانية.");
  process.exit(allGood ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ حصل خطأ عام أثناء السيناريو:", err);
  process.exit(1);
});
