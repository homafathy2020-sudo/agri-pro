// scripts/testFirestoreRules.js
//
// audit finding F-015: قبل الملف ده، مفيش أي اختبار آلي لقواعد Firestore
// نفسها — أهم طبقة حماية في المشروع كله (عزل بيانات كل شركة عن التانية
// معتمد بالكامل عليها، مش على أي كود في الفرونت) كانت بتتراجع بالعين بس
// وقت أي تعديل. السكريبت ده بيشغّل سيناريوهات تهديد فعلية (مش وصفية) ضد
// القواعد الحقيقية في firestore.rules عبر Firebase Local Emulator — مش
// mock، نفس ملف القواعد اللي بينتشر فعلياً.
//
// الفئات التلاتة المطلوبة في roadmap الـ phase دي بالظبط:
//   1) عزل البيانات بين الشركات (A ضد B)
//   2) مستخدم عادي ضد أدمن
//   3) مستندات بحقول متلاعب بيها (تخريب متعمد لحقل)
//
// ─────────────────────────────────────────────────────────────────────
// طريقة التشغيل (على جهازك، مش في بيئة التطوير اللي كتبت بيها الملف ده):
//   1. npm install --save-dev @firebase/rules-unit-testing   (لو لسه مش متثبتة)
//   2. تأكد إن عندك Java متثبت (متطلب Firebase Emulator نفسه، مش المشروع)
//   3. npm run test:rules
//      (بيشغّل: npx firebase-tools emulators:exec --only firestore "node scripts/testFirestoreRules.js"
//       — بيبدأ Firestore emulator محلي فاضي، يشغّل الاختبارات، يقفله.
//       مفيش أي اتصال بمشروع Firebase حقيقي ولا إنترنت وقت التشغيل نفسه،
//       npx بس محتاج إنترنت أول مرة عشان يحمّل firebase-tools.)
//
// ⚠️ ملحوظة أمانة لازم تتقال بوضوح: الملف ده اتكتب واتراجع منطقياً سطر
// بسطر مقابل firestore.rules الفعلي (نفس الملف اللي قريته بالكامل قبل ما
// أكتب أي سطر هنا)، لكن معنديش القدرة أشغّل Firestore emulator فعلياً في
// بيئة العمل الحالية بتاعتي — مفيش اتصال بـ npm registry هنا لتثبيت
// @firebase/rules-unit-testing أصلاً (سياسة أمان في بيئة التطوير دي، مش
// قيد في مشروعك). يعني ده أول تسليم في كل الـ phases من غير ما أقدر
// أوعدك إنه "شغال 100%" زي باقي الملفات اللي عدلتها وعملتلها syntax
// check فعلي بـ esbuild — أنا واثق في المنطق لأني راجعته يدوياً مقابل
// القواعد الحقيقية، لكن لازم إنت تشغّله فعلياً على جهازك وتتأكد.
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const fs = require("fs");
const path = require("path");

// ❗ لازم يطابق أول قيمة في ADMIN_UIDS بـ src/config/constants/admin.js
// (ونفس القيمة في firestore.rules → isAdmin()) — لو غيّرت واحدة، غيّر
// التلاتة مع بعض.
const ADMIN_UID = "VOS2uWwCxJUsmTgT4aSBqvoxPwa2";
const COMPANY_A = "test-company-a";
const COMPANY_B = "test-company-b";

let testEnv;
let passed = 0;
let failed = 0;
const failures = [];

async function test(groupLabel, name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ groupLabel, name, err });
    console.log(`  ❌ ${name}`);
    console.log(`     ${String(err.message || err).split("\n")[0]}`);
  }
}

function ctx(uid) {
  return uid
    ? testEnv.authenticatedContext(uid).firestore()
    : testEnv.unauthenticatedContext().firestore();
}

// وثيقة jobs صحيحة بالكامل — أساس نعدّل فيه لكل سيناريو تخريب حقل.
const validJob = {
  acres: 10,
  pricePerAcre: 200,
  fuelUsed: 5,
  fuelPriceAtJob: 15,
  amountPaid: 0,
  date: "2026-01-15",
  client: "عميل تجريبي",
  workType: "حرث",
};

async function seedFixtures() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc(`users/${COMPANY_A}`).set({ email: "a@test.local", displayName: "شركة أ" });
    await db.doc(`users/${COMPANY_B}`).set({ email: "b@test.local", displayName: "شركة ب" });
    await db.doc(`users/${COMPANY_A}/jobs/job1`).set(validJob);
    await db.doc(`users/${COMPANY_B}/jobs/job1`).set(validJob);
    await db.doc(`backups/${COMPANY_A}`).set({ lastBackupAt: new Date() });
    await db.doc(`backups/${COMPANY_B}`).set({ lastBackupAt: new Date() });
    await db.doc(`backups/${COMPANY_A}/snapshots/snap1`).set({ createdAt: new Date() });
    await db.doc(`backups/${COMPANY_B}/snapshots/snap1`).set({ createdAt: new Date() });
    await db.doc("errorLogs/err1").set({ userId: COMPANY_A, message: "test", resolved: false });
    await db.doc("adminMessages/broadcast1").set({ targetUserId: null, text: "بث عام" });
    await db.doc("adminMessages/targetedA").set({ targetUserId: COMPANY_A, text: "لشركة أ بس" });
    await db.doc("adminMessages/targetedB").set({ targetUserId: COMPANY_B, text: "لشركة ب بس" });
  });
}

async function main() {
  testEnv = await initializeTestEnvironment({
    projectId: "agri-pro-rules-test",
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });

  await seedFixtures();

  console.log("\n── المجموعة 1: عزل البيانات بين الشركات (A ضد B) ──");
  {
    const asA = ctx(COMPANY_A);
    await test("isolation", "شركة أ تقدر تقرا بياناتها هي (positive control)", () =>
      assertSucceeds(asA.doc(`users/${COMPANY_A}/jobs/job1`).get())
    );
    await test("isolation", "شركة أ ممنوعة تقرا وظيفة شركة ب", () =>
      assertFails(asA.doc(`users/${COMPANY_B}/jobs/job1`).get())
    );
    await test("isolation", "شركة أ ممنوعة تكتب/تعدّل وظيفة شركة ب", () =>
      assertFails(asA.doc(`users/${COMPANY_B}/jobs/job1`).set(validJob))
    );
    await test("isolation", "شركة أ ممنوعة تمسح وظيفة شركة ب", () =>
      assertFails(asA.doc(`users/${COMPANY_B}/jobs/job1`).delete())
    );
    await test("isolation", "شركة أ ممنوعة تقرا ملف بروفايل شركة ب (users/{uid})", () =>
      assertFails(asA.doc(`users/${COMPANY_B}`).get())
    );
    await test("isolation", "شركة أ ممنوعة تعمل list لكل المستخدمين", () =>
      assertFails(asA.collection("users").get())
    );
    await test("isolation", "شركة أ ممنوعة تقرا حتى metadata النسخة الاحتياطية بتاعة شركة ب", () =>
      assertFails(asA.doc(`backups/${COMPANY_B}`).get())
    );
    await test("isolation", "شركة أ ممنوعة تقرا محتوى snapshot بتاع شركة ب", () =>
      assertFails(asA.doc(`backups/${COMPANY_B}/snapshots/snap1`).get())
    );
  }

  console.log("\n── المجموعة 2: مستخدم عادي ضد أدمن ──");
  {
    const asA = ctx(COMPANY_A);
    const asAdmin = ctx(ADMIN_UID);

    await test("admin-vs-user", "مستخدم عادي ممنوع يقرا سجل الأخطاء (errorLogs)", () =>
      assertFails(asA.collection("errorLogs").get())
    );
    await test("admin-vs-user", "مستخدم عادي ممنوع يعلّم خطأ كـ متحلّ حتى لو بتاعه هو", () =>
      assertFails(asA.doc("errorLogs/err1").update({ resolved: true }))
    );
    await test("admin-vs-user", "مستخدم عادي ممنوع يمسح سجل خطأ", () =>
      assertFails(asA.doc("errorLogs/err1").delete())
    );
    await test("admin-vs-user", "مستخدم عادي ممنوع ينشئ رسالة أدمن (adminMessages)", () =>
      assertFails(asA.doc("adminMessages/fromUser").set({ targetUserId: null, text: "hack" }))
    );
    await test("admin-vs-user", "مستخدم عادي يقدر يقرا رسالة بث عامة موجّهة لكل الناس", () =>
      assertSucceeds(asA.doc("adminMessages/broadcast1").get())
    );
    await test("admin-vs-user", "مستخدم عادي يقدر يقرا رسالة موجّهة له هو بالتحديد", () =>
      assertSucceeds(asA.doc("adminMessages/targetedA").get())
    );
    await test("admin-vs-user", "مستخدم عادي ممنوع يقرا رسالة موجّهة لشركة تانية بالتحديد", () =>
      assertFails(asA.doc("adminMessages/targetedB").get())
    );

    await test("admin-vs-user", "الأدمن يقدر يقرا سجل الأخطاء كامل", () =>
      assertSucceeds(asAdmin.collection("errorLogs").get())
    );
    await test("admin-vs-user", "الأدمن يقدر يعلّم خطأ كـ متحلّ", () =>
      assertSucceeds(asAdmin.doc("errorLogs/err1").update({ resolved: true }))
    );
    await test("admin-vs-user", "الأدمن يقدر يعمل list لكل المستخدمين", () =>
      assertSucceeds(asAdmin.collection("users").get())
    );
    await test("admin-vs-user", "الأدمن يقدر يقرا ملف بروفايل أي شركة (users/{uid})", () =>
      assertSucceeds(asAdmin.doc(`users/${COMPANY_A}`).get())
    );
    // audit finding F-003 (Phase 5): كانت هنا assertFails — الأدمن ما
    // كانش يقدر يقرا محتوى subcollection بيانات شركة (jobs/payments/
    // salaryEntries...) خالص، بس بروفايلها الأساسي. اتضافت || isAdmin()
    // لقاعدة القراءة العامة (match /{document=**}) في firestore.rules
    // عشان يقدر تقرير فحص تكامل البيانات المجمّع (adminIntegrityService)
    // يقرا بيانات كل الشركات. القراءة بس — لسه مفيش أي مسار كتابة جديد
    // للأدمن على بيانات شركة تانية.
    await test(
      "admin-vs-user",
      "الأدمن يقدر يقرا محتوى subcollection بيانات أي شركة (jobs) — لازمة لتقرير فحص التكامل المجمّع",
      () => assertSucceeds(asAdmin.doc(`users/${COMPANY_A}/jobs/job1`).get())
    );
    await test(
      "admin-vs-user",
      "شركة أ لسه ممنوعة تقرا subcollection بيانات شركة ب حتى بعد إضافة صلاحية الأدمن (مش هي الأدمن)",
      () => assertFails(asA.doc(`users/${COMPANY_B}/jobs/job1`).get())
    );
  }

  console.log("\n── المجموعة 3: مستندات بحقول متلاعب بيها (تخريب متعمد) ──");
  {
    const asA = ctx(COMPANY_A);

    await test("tampering", "إنشاء وظيفة ببيانات صحيحة (positive control)", () =>
      assertSucceeds(asA.doc(`users/${COMPANY_A}/jobs/valid1`).set(validJob))
    );
    await test("tampering", "ممنوع إنشاء وظيفة بـ pricePerAcre سالب", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/jobs/neg1`).set({ ...validJob, pricePerAcre: -500 }))
    );
    await test("tampering", "ممنوع إنشاء وظيفة بـ acres نوعه نص مش رقم", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/jobs/bad1`).set({ ...validJob, acres: "كتير" }))
    );
    await test("tampering", "ممنوع إنشاء وظيفة من غير acres أصلاً (حقل مطلوب)", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/jobs/missing1`).set({ pricePerAcre: 200 }))
    );
    await test("tampering", "ممنوع إنشاء وظيفة بمبلغ فوق السقف المسموح (> 1,000,000,000)", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/jobs/huge1`).set({ ...validJob, pricePerAcre: 5000000000 }))
    );
    await test("tampering", "ممنوع إنشاء قيد راتب بـ type مش من الأنواع المسموحة", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/salaryEntries/bad1`).set({ amount: 100, type: "غير_موجود" }))
    );
    await test("tampering", "ممنوع إنشاء سجل خطأ منسوب لمستخدم تاني (userId مزوّر)", () =>
      assertFails(asA.doc("errorLogs/forged1").set({ userId: COMPANY_B, message: "spoofed" }))
    );
    await test("tampering", "ممنوع تعديل notes بنص أطول من 3000 حرف", () =>
      assertFails(asA.doc(`users/${COMPANY_A}/jobs/job1`).update({ notes: "x".repeat(3001) }))
    );
  }

  await testEnv.cleanup();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`النتيجة: ${passed} نجح، ${failed} فشل، من إجمالي ${passed + failed}`);
  if (failed > 0) {
    console.log("\nالاختبارات اللي فشلت:");
    failures.forEach((f) => {
      console.log(`  [${f.groupLabel}] ${f.name}`);
      console.log(`    ${f.err.message}`);
    });
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("فشل تشغيل الاختبارات نفسها (مش بالضرورة مشكلة في القواعد):", err);
  process.exitCode = 1;
});
