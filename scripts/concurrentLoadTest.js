// scripts/concurrentLoadTest.js
//
// بيحاكي N شركة (نفس الشركات اللي زرعها seedLoadTestCompanies.js) وهي
// بتفتح التطبيق كلها في نفس اللحظة بالظبط — تسجيل دخول حقيقي + تحميل
// بياناتها بنفس طريقة التطبيق الفعلية (onSnapshot على كل مجموعة، بالظبط
// زي useDataLoader.js) — كل ده في نفس الوقت، عشان نشوف هل السيرفر
// (Firestore بتاع my-app-load-test) هيستحمل ولا لأ لو كذا شركة فتحوا
// البرنامج مع بعض، وهل البيانات بترجع صح ومكتملة لكل واحدة من غير أي
// تداخل أو تلوث بين شركة وشركة تانية.
//
// ============================================================================
// السكريبت ده بيقرأ بس (Reads) + تسجيل دخول — مفيش أي كتابة أو تعديل أو
// حذف لأي بيانات. وبيشتغل بس على مشروع my-app-load-test (بيتأكد من
// projectId قبل ما يبدأ). آمن تمامًا تشغّله أد ما تحب.
// ============================================================================
//
// طريقة التشغيل (لازم يكون شغال بعد seedLoadTestCompanies.js):
// ------------------------------------------------------
//   node scripts/concurrentLoadTest.js [عدد الشركات=50] [باسورد] [مسار firebase.js]
//
// مثال:
//   node scripts/concurrentLoadTest.js
//   node scripts/concurrentLoadTest.js 20
//
// ملحوظة مهمة: السكريبت ده بيشتغل من Node مباشرة (مش متصفح حقيقي)، فمفيش
// عنده الـ persistentLocalCache (IndexedDB) اللي التطبيق بيستخدمها في
// المتصفح — يعني مش هيقيس فايدة "تقليل القراءات المتكررة عند إعادة
// الفتح" (دي محتاجة اختبار حقيقي بمتصفح، شوف الـ README). اللي بيقيسه
// هنا حاجة تانية مهمة برضو: هل السيرفر بيتحمل فتح 50 شركة *مرة واحدة* في
// نفس اللحظة بسرعة معقولة ومن غير أخطاء، وهل بيانات كل شركة بترجع كاملة
// وصحيحة من غير تداخل مع شركة تانية.

const fs = require("fs");
const path = require("path");

const COMPANY_COUNT = Math.max(1, Number(process.argv[2]) || 50);
const PASSWORD = process.argv[3] || "LoadTest@2026";
const FIREBASE_JS_PATH = process.argv[4] || path.resolve(__dirname, "../src/config/firebase.js");
const EMAIL_DOMAIN = "agripro-test.local";
const PER_COMPANY_TIMEOUT_MS = 30000;

// ─── نستخرج firebaseConfig مباشرة من src/config/firebase.js بدل ما نطلب
// من المستخدم ينسخها في مكان تاني (نفس القيم المستخدمة فعليًا في
// التطبيق، صفر احتمال اختلاف) ───────────────────────────────────────────
function loadFirebaseConfig() {
  const src = fs.readFileSync(FIREBASE_JS_PATH, "utf8");
  const match = src.match(/const\s+firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    throw new Error(`ماقدرتش ألاقي firebaseConfig جوه ${FIREBASE_JS_PATH}`);
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return ${match[1]};`)();
}

const { initializeApp, deleteApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const {
  getFirestore, collection, doc, query, orderBy, onSnapshot,
} = require("firebase/firestore");

const firebaseConfig = loadFirebaseConfig();
if (firebaseConfig.projectId !== "my-app-load-test") {
  console.error(
    `❌ الإعدادات دي بتاعة مشروع "${firebaseConfig.projectId}"، مش "my-app-load-test". ` +
    `السكريبت ده اتعمل يشتغل بس على المشروع التجريبي — وقف هنا عشان الأمان.`
  );
  process.exit(1);
}

// نفس شكل الـ 12 مجموعة اللي useDataLoader.js بيعمّلها subscribe بالظبط
// (driverCosts مستبعدة عمدًا هنا: الشركات التجريبية دي جديدة ومفيهاش
// أي بيانات فيها من الأساس، بالظبط زي أي حساب حقيقي بعد الـ migration).
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

function runOneCompany(index) {
  const tag = String(index).padStart(2, "0");
  const email = `loadtest-co-${tag}@${EMAIL_DOMAIN}`;
  const appName = `loadtest-app-${tag}`;
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const result = {
      email, ok: false, error: null,
      signInMs: null, fullLoadMs: null, totalDocs: 0,
      counts: {}, integrity: [],
    };

    let app, authInst, dbInst;
    const unsubscribes = [];
    let settled = false;
    const remaining = new Set([...COLLECTIONS.map((c) => c.key), "settings"]);

    const finish = async (ok, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      unsubscribes.forEach((u) => { try { u(); } catch (_) {} });
      result.ok = ok;
      if (error) result.error = String(error?.message || error);
      try { if (app) await deleteApp(app); } catch (_) {}
      resolve(result);
    };

    const timeoutHandle = setTimeout(() => {
      finish(false, `Timeout بعد ${PER_COMPANY_TIMEOUT_MS}ms — لسه مستني: ${[...remaining].join(", ")}`);
    }, PER_COMPANY_TIMEOUT_MS);

    (async () => {
      try {
        app = initializeApp(firebaseConfig, appName);
        authInst = getAuth(app);
        dbInst = getFirestore(app);

        const signInStart = Date.now();
        const cred = await signInWithEmailAndPassword(authInst, email, PASSWORD);
        result.signInMs = Date.now() - signInStart;
        const uid = cred.user.uid;

        const checkAllLoaded = () => {
          if (remaining.size === 0 && !settled) {
            result.fullLoadMs = Date.now() - startedAt;
            runIntegrityChecks(result);
            finish(true, null);
          }
        };

        COLLECTIONS.forEach(({ key, orderByField }) => {
          const colRef = collection(dbInst, "users", uid, key);
          const q = orderByField ? query(colRef, orderBy(orderByField, "desc")) : colRef;
          const unsub = onSnapshot(
            q,
            (snap) => {
              const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              result.counts[key] = docs.length;
              result._raw = result._raw || {};
              result._raw[key] = docs;
              result.totalDocs = Object.values(result.counts).reduce((a, b) => a + b, 0);
              remaining.delete(key);
              checkAllLoaded();
            },
            (err) => finish(false, `فشل تحميل ${key}: ${err.message}`)
          );
          unsubscribes.push(unsub);
        });

        const settingsRef = doc(dbInst, "users", uid, "meta", "settings");
        const unsubSettings = onSnapshot(
          settingsRef,
          (snap) => {
            result.counts.settings = snap.exists() ? 1 : 0;
            remaining.delete("settings");
            checkAllLoaded();
          },
          (err) => finish(false, `فشل تحميل settings: ${err.message}`)
        );
        unsubscribes.push(unsubSettings);
      } catch (err) {
        finish(false, err);
      }
    })();
  });
}

// فحوصات سلامة أساسية — الأرقام دي ثابتة في seedLoadTestCompanies.js
// (مش عشوائية)، فأي اختلاف عنها معناه فيه بيانات ناقصة أو زيادة أو
// تداخل بين شركة وشركة تانية.
function runIntegrityChecks(result) {
  const raw = result._raw || {};
  const problems = [];

  if (result.counts.drivers !== 6) problems.push(`عدد السائقين ${result.counts.drivers} (المتوقع 6)`);
  if (result.counts.equipment !== 8) problems.push(`عدد المعدات ${result.counts.equipment} (المتوقع 8)`);
  if (result.counts.jobs !== 180) problems.push(`عدد العمليات ${result.counts.jobs} (المتوقع 180)`);

  const jobIds = new Set((raw.jobs || []).map((j) => j.id));
  const orphanPayments = (raw.payments || []).filter((p) => !jobIds.has(p.jobId));
  if (orphanPayments.length > 0) problems.push(`${orphanPayments.length} دفعة مرتبطة بعملية مش موجودة`);

  const invoiceIds = new Set((raw.supplierInvoices || []).map((i) => i.id));
  const orphanSupplierPayments = (raw.supplierPayments || []).filter((p) => !invoiceIds.has(p.supplierInvoiceId));
  if (orphanSupplierPayments.length > 0) problems.push(`${orphanSupplierPayments.length} دفعة مورد مرتبطة بفاتورة مش موجودة`);

  let badAmounts = 0;
  Object.values(raw).forEach((docs) => (docs || []).forEach((d) => {
    if (d.amount !== undefined && (Number.isNaN(d.amount) || d.amount < 0)) badAmounts++;
  }));
  if (badAmounts > 0) problems.push(`${badAmounts} مبلغ غير سليم (NaN أو سالب)`);

  result.integrity = problems;
  delete result._raw; // مش محتاجينها في التقرير النهائي، بس كانت لازمة للفحص
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

async function main() {
  console.log(`جاري محاكاة فتح ${COMPANY_COUNT} شركة في نفس اللحظة (my-app-load-test)...\n`);
  const overallStart = Date.now();

  const results = await Promise.all(
    Array.from({ length: COMPANY_COUNT }, (_, i) => runOneCompany(i + 1))
  );

  const overallMs = Date.now() - overallStart;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const withIntegrityIssues = ok.filter((r) => r.integrity.length > 0);

  const signInTimes = ok.map((r) => r.signInMs).filter((n) => n != null).sort((a, b) => a - b);
  const loadTimes = ok.map((r) => r.fullLoadMs).filter((n) => n != null).sort((a, b) => a - b);
  const totalDocsRead = ok.reduce((s, r) => s + r.totalDocs, 0);

  console.log("──────────────── النتيجة ────────────────");
  console.log(`الوقت الكلي (من أول شركة لحد آخر واحدة خلصت): ${overallMs}ms`);
  console.log(`نجحت: ${ok.length}/${COMPANY_COUNT}  |  فشلت/تعدت المهلة: ${failed.length}`);
  console.log(`إجمالي المستندات اللي اتقرأت في الدفعة دي: ${totalDocsRead}`);
  if (signInTimes.length > 0) {
    console.log(
      `وقت تسجيل الدخول (ms) — أقل: ${signInTimes[0]} | وسيط: ${percentile(signInTimes, 0.5)} | ` +
      `95%: ${percentile(signInTimes, 0.95)} | أكبر: ${signInTimes[signInTimes.length - 1]}`
    );
  }
  if (loadTimes.length > 0) {
    console.log(
      `وقت تحميل كل البيانات (ms) — أقل: ${loadTimes[0]} | وسيط: ${percentile(loadTimes, 0.5)} | ` +
      `95%: ${percentile(loadTimes, 0.95)} | أكبر: ${loadTimes[loadTimes.length - 1]}`
    );
  }

  if (failed.length > 0) {
    console.log("\n⚠️ الشركات اللي فشلت:");
    failed.forEach((r) => console.log(`  - ${r.email}: ${r.error}`));
  }
  if (withIntegrityIssues.length > 0) {
    console.log("\n🚨 مشاكل في سلامة البيانات (لازم تتراجع فورًا لو ظهر أي سطر هنا):");
    withIntegrityIssues.forEach((r) => {
      console.log(`  - ${r.email}:`);
      r.integrity.forEach((p) => console.log(`      • ${p}`));
    });
  } else {
    console.log("\n✅ كل البيانات رجعت كاملة وصحيحة لكل شركة، من غير أي تداخل بين شركة وتانية.");
  }

  process.exit(failed.length > 0 || withIntegrityIssues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("❌ حصل خطأ عام أثناء الاختبار:", err);
  process.exit(1);
});
