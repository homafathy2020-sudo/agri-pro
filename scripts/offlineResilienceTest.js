// scripts/offlineResilienceTest.js
//
// أهم اختبار في الحزمة دي كلها: بيتأكد إن الأولوية اللي إحنا ماشيين
// عليها من أول يوم ("الأوفلاين شغال 100%، صفر فقد أو تكرار في البيانات
// المالية") فعلاً شغالة، مش بس على الورق.
//
// السكريبت ده بيفتح متصفح Chromium حقيقي (مش سكريبت Node بيكلم Firestore
// مباشرة زي السكريبتات التانية)، ويعمل بالظبط اللي مستخدم حقيقي هيعمله:
//
//   1. يسجّل دخول بحساب شركة تجريبية.
//   2. يفتح صفحة العمليات.
//   3. يقطع النت (offline حقيقي على مستوى المتصفح).
//   4. يضيف عملية شغل جديدة وهو أوفلاين — ويتأكد إنها ظهرت فورًا في
//      الواجهة (optimistic update)، من غير ما ينتظر النت أصلاً.
//   5. يقفل المتصفح تمامًا (مش بس تاب) وهو لسه أوفلاين وفيه بيانات لسه
//      متسجلتش على السيرفر — يعني محاكاة "المستخدم قفل التطبيق فعلاً"
//      مش بس سايبه فاتح.
//   6. يفتح المتصفح تاني (بنفس بيانات الجلسة المحفوظة محليًا) ولسه
//      أوفلاين — ويتأكد إن العملية لسه ظاهرة (يعني الكاش المحلي فعلاً
//      محفوظ على القرص، مش بس في الذاكرة).
//   7. يرجّع النت، يستنى شوية عشان المزامنة تحصل.
//   8. يعمل reload كامل للصفحة (يجبر قراءة جديدة من السيرفر + الكاش)
//      ويتأكد إن العملية موجودة **مرة واحدة بالظبط** — لا فقدت، ولا
//      اتكررت.
//   9. يتأكد من نفس الحقيقة دي مباشرة من على السيرفر (مش بس من الواجهة)
//      عن طريق Firebase Admin SDK — عشان نقفل أي شك إن الواجهة بتوري
//      حاجة مش موجودة فعلاً على السيرفر.
//  10. يمسح العملية الاختبارية دي تاني في الآخر (تنظيف تلقائي) عشان
//      بيانات الشركة ترجع زي ما كانت بالظبط لأي اختبار تاني بعد كده.
//
// ============================================================================
// السكريبت ده بيتعامل مع مشروع my-app-load-test التجريبي بس (فيه فحص
// أمان بيتأكد من الرابط قبل ما يبدأ أي حاجة)، وبيستخدم شركة تجريبية
// واحدة بس من الـ 10/50 اللي اتزرعوا قبل كده.
// ============================================================================
//
// المتطلبات قبل التشغيل (مرة واحدة بس):
//   npm install --save-dev playwright
//   npx playwright install chromium
//
// طريقة التشغيل:
//   node scripts/offlineResilienceTest.js scripts/serviceAccountKey.json [رقم الشركة=05] [باسورد] [رابط الموقع] [headed|headless]
//
// مثال:
//   node scripts/offlineResilienceTest.js scripts/serviceAccountKey.json 05
//
// هيفتح نافذة متصفح حقيقية على شاشتك (افتراضيًا) — سيبها لوحدها لحد ما
// السكريبت يخلص ويقفلها بنفسه، من غير ما تلمسها أو تقفلها يدويًا.

const path = require("path");
const os = require("os");
const fs = require("fs");

const keyPathArg = process.argv[2];
if (!keyPathArg) {
  console.error(
    "استخدام: node scripts/offlineResilienceTest.js <path-to-service-account.json> [رقم الشركة=05] [باسورد] [رابط الموقع]"
  );
  process.exit(1);
}
const COMPANY_TAG = (process.argv[3] || "05").padStart(2, "0");
const PASSWORD = process.argv[4] || "LoadTest@2026";
const BASE_URL = (process.argv[5] || "https://my-app-load-test.web.app").replace(/\/$/, "");
// افتراضيًا شغّال بمتصفح ظاهر (مش headless) — بعض حمايات Google ضد
// الأتمتة (bot detection على صفحات تسجيل الدخول) بتتعامل مع المتصفح
// الـ headless بشكل مختلف وممكن توقف طلب الدخول من غير رد أصلاً. لو
// حابب تشغّله من غير ما يفتح نافذة (مثلاً على سيرفر من غير شاشة)،
// مرّر "headless" كآخر argument.
const HEADLESS = (process.argv[6] || "headed").toLowerCase() === "headless";
const EMAIL = `loadtest-co-${COMPANY_TAG}@agripro-test.local`;

// حماية أمان: نفس فحص المشروع اللي في كل السكريبتات التانية، هنا على
// مستوى الرابط والمفتاح مع بعض عشان مفيش لبس.
if (!/my-app-load-test/i.test(BASE_URL)) {
  console.error(
    `❌ الرابط "${BASE_URL}" مش بتاع my-app-load-test. السكريبت ده اتعمل يشتغل بس على ` +
    `البيئة التجريبية — وقف هنا عشان الأمان.`
  );
  process.exit(1);
}
const serviceAccount = require(path.resolve(keyPathArg));
if (serviceAccount.project_id !== "my-app-load-test") {
  console.error(
    `❌ المفتاح ده بتاع مشروع "${serviceAccount.project_id}"، مش "my-app-load-test". وقف هنا عشان الأمان.`
  );
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (err) {
  console.error(
    "❌ مكتبة playwright مش متثبتة. ثبّتها مرة واحدة بس بالأمر:\n" +
    "   npm install --save-dev playwright && npx playwright install chromium"
  );
  process.exit(1);
}

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: cert(serviceAccount) });
const adminAuth = getAuth();
const db = getFirestore();

const TEST_MARKER = `اختبار-أوفلاين-${Date.now()}`;
const SYNC_WAIT_MS = 8000;

// عنصر داخل الفورم بيتحدد بالـ label المجاور ليه (مفيش id/htmlFor في
// الفورم الحقيقي، فبنعتمد على القرابة في الـ DOM بدل getByLabel).
const fieldByLabel = (scope, labelText, tag = "input") =>
  scope.locator(`div:has(> label:text-is("${labelText}")) ${tag}`).first();

async function main() {
  console.log(`جاري اختبار الأوفلاين على شركة ${EMAIL} عبر ${BASE_URL}...\n`);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "agripro-offline-test-"));
  let context = await chromium.launchPersistentContext(userDataDir, { headless: HEADLESS });
  let page = await context.newPage();

  try {
    // ── 1) تسجيل الدخول (أونلاين عادي) ────────────────────────────────────
    console.log("[1] تسجيل الدخول...");
    await page.goto(`${BASE_URL}/auth`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "دخول" }).waitFor({ state: "visible", timeout: 20000 });

    // بنسمع لاستجابة Firebase Auth نفسها بدل ما نستنى الـ Toast (اللي
    // بيختفي تلقائيًا بعد كام ثانية، فممكن نفوّته لو استنينا كتير قبل
    // ما نشوف نص الصفحة). ده بيدّينا السبب الحقيقي فورًا (بيانات غلط،
    // too-many-requests، أو حتى إن الطلب مارجعش خالص).
    const authResponsePromise = page
      .waitForResponse(
        (resp) => /identitytoolkit\.googleapis\.com/.test(resp.url()) && resp.request().method() === "POST",
        { timeout: 25000 }
      )
      .catch(() => null);

    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "دخول" }).click();

    const authResp = await authResponsePromise;
    if (authResp) {
      let bodyJson = null;
      try { bodyJson = await authResp.json(); } catch { /* ignore */ }
      const errMsg = bodyJson?.error?.message;
      console.log(`    استجابة Firebase Auth: HTTP ${authResp.status()}${errMsg ? " — " + errMsg : " (نجحت)"}`);
    } else {
      console.log("    ⚠️ الطلب لـ Firebase Auth مارجعش خالص خلال 25 ثانية — ممكن يكون في حجب شبكة لـ identitytoolkit.googleapis.com من الجهاز/الشبكة دي.");
    }

    try {
      await page.waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 10000 });
      console.log("    ✅ الدخول نجح.");
    } catch (loginErr) {
      // تشخيص إضافي احتياطي لو السبب لسه مش واضح من استجابة Auth فوق.
      const bodyText = await page.locator("body").innerText().catch(() => "(تعذّر قراءة نص الصفحة)");
      const shotPath = path.resolve(`offline-test-login-failure-${Date.now()}.png`);
      await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
      console.error(`\n❌ الدخول فشل. نص الصفحة دلوقتي:`);
      console.error(`---\n${bodyText.slice(0, 1000)}\n---`);
      console.error(`📸 لقطة شاشة اتحفظت هنا: ${shotPath} (ابعتهالي لو مش واضح السبب)`);
      throw loginErr;
    }

    // ── 2) فتح صفحة العمليات ──────────────────────────────────────────────
    console.log("[2] فتح صفحة العمليات...");
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: "domcontentloaded" });
    const addButton = page.getByRole("button", { name: /تسجيل (عملية|أول عملية)/ });
    await addButton.waitFor({ state: "visible", timeout: 20000 });
    console.log("    ✅ الصفحة اتحمّلت.");

    // ── 2ب) استنى الـ service worker ياخد السيطرة قبل ما نقطع النت ─────────
    // التطبيق PWA بيعتمد على service worker (Workbox) لتخزين app shell
    // وقت أول زيارة، عشان لما نقفل المتصفح ونفتحه تاني أوفلاين، الصفحة
    // نفسها (HTML/JS) تقدر تفتح من الكاش أصلاً قبل ما Firestore يدخل في
    // الموضوع. لو ده اتأخر، بنكمل برضو بس بنوضح إن ده ممكن يأثر على
    // خطوة "إعادة الفتح أوفلاين" لسبب مالوش علاقة ببيانات Firestore.
    console.log("[2ب] استنى الـ service worker ياخد السيطرة...");
    try {
      await page.waitForFunction(
        () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
        null,
        { timeout: 15000 }
      );
      console.log("    ✅ الـ service worker شغّال ومسيطر — الصفحة هتقدر تتفتح من الكاش حتى أوفلاين.");
    } catch {
      console.log("    ⚠️ الـ service worker ماخدش السيطرة خلال 15 ثانية — لو خطوة (٦) فشلت في فتح الصفحة، ده على الأغلب السبب (تأخير تسجيل الـ SW)، مش مشكلة في بيانات Firestore نفسها.");
    }

    // ── 3) قطع النت فعليًا على مستوى المتصفح ───────────────────────────────
    console.log("[3] قطع النت (أوفلاين حقيقي)...");
    await context.setOffline(true);

    // ── 4) إضافة عملية جديدة وهو أوفلاين ───────────────────────────────────
    console.log("[4] إضافة عملية شغل جديدة وإحنا أوفلاين...");
    const addStart = Date.now();
    await addButton.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await fieldByLabel(dialog, "المعدة *", "select").selectOption({ index: 1 });
    await fieldByLabel(dialog, "اسم العميل / الأرض *", "input").fill(TEST_MARKER);
    await fieldByLabel(dialog, "عدد الأفدنة *", "input").fill("7");
    await dialog.getByRole("button", { name: "حفظ" }).click();

    await page.getByText(TEST_MARKER).waitFor({ state: "visible", timeout: 3000 });
    const optimisticMs = Date.now() - addStart;
    console.log(`    ✅ ظهرت فورًا في الواجهة وإحنا أوفلاين (خلال ${optimisticMs}ms) — الـ optimistic update شغال صح.`);

    // ── 5) قفل المتصفح تمامًا وهو لسه أوفلاين وفيه بيانات مش متسجلة ────────
    console.log("[5] قفل المتصفح بالكامل (مش بس تاب) وإحنا لسه أوفلاين...");
    await context.close();

    // ── 6) فتحه تاني (بروفايل المتصفح المحفوظ على القرص) ولسه أوفلاين ──────
    console.log("[6] فتح المتصفح تاني (نفس بيانات الجلسة المحفوظة) ولسه أوفلاين...");
    context = await chromium.launchPersistentContext(userDataDir, { headless: HEADLESS, offline: true });
    page = await context.newPage();
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: "domcontentloaded" });
    await page.getByText(TEST_MARKER).waitFor({ state: "visible", timeout: 15000 });
    console.log("    ✅ العملية لسه ظاهرة بعد إعادة الفتح — يعني الكاش المحلي فعلاً محفوظ على القرص، مش بس في الذاكرة.");

    // ── 7) رجوع النت ────────────────────────────────────────────────────────
    console.log("[7] رجوع النت...");
    await context.setOffline(false);
    console.log(`    منتظرين ${SYNC_WAIT_MS / 1000} ثانية عشان المزامنة تحصل مع السيرفر...`);
    await page.waitForTimeout(SYNC_WAIT_MS);

    // ── 8) reload كامل + التأكد إنها موجودة مرة واحدة بالظبط في الواجهة ────
    console.log("[8] إعادة تحميل الصفحة بالكامل والتأكد من عدم الفقد أو التكرار...");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByText(TEST_MARKER).first().waitFor({ state: "visible", timeout: 20000 });
    const uiCount = await page.getByText(TEST_MARKER).count();
    if (uiCount === 1) {
      console.log("    ✅ موجودة مرة واحدة بالظبط في الواجهة بعد المزامنة.");
    } else {
      console.log(`    🚨 ظهرت ${uiCount} مرة في الواجهة بعد المزامنة (المفروض مرة واحدة بالظبط)!`);
    }

    // ── 9) التأكيد المباشر من السيرفر (Firestore) مش بس من الواجهة ─────────
    console.log("[9] التأكيد المباشر من السيرفر عبر Firebase Admin SDK...");
    const userRecord = await adminAuth.getUserByEmail(EMAIL);
    const jobsSnap = await db
      .collection("users").doc(userRecord.uid).collection("jobs")
      .where("client", "==", TEST_MARKER)
      .get();
    const serverCount = jobsSnap.size;

    let allGood = uiCount === 1 && serverCount === 1;
    if (serverCount === 1) {
      console.log("    ✅ موجودة مرة واحدة بالظبط على السيرفر فعليًا (مش وهم كاش).");
    } else if (serverCount === 0) {
      console.log("    🚨 مش موجودة على السيرفر خالص — العملية اتفقدت أثناء المزامنة!");
    } else {
      console.log(`    🚨 موجودة ${serverCount} مرة على السيرفر — تكرار حقيقي في البيانات المالية!`);
    }

    // ── 10) تنظيف: مسح العملية الاختبارية عشان بيانات الشركة ترجع زي الأول ──
    console.log("[10] تنظيف — مسح العملية/العمليات الاختبارية اللي اتضافت...");
    const batch = db.batch();
    jobsSnap.docs.forEach((d) => batch.delete(d.ref));
    if (jobsSnap.size > 0) await batch.commit();
    console.log(`    🧹 اتمسح ${jobsSnap.size} مستند اختباري. بيانات الشركة رجعت زي ما كانت.`);

    console.log(allGood
      ? "\n✅ اختبار الأوفلاين عدّى بنجاح: الإضافة ظهرت فورًا وهي أوفلاين، اتحفظت محليًا حتى بعد قفل المتصفح بالكامل، ووصلت للسيرفر مرة واحدة بالظبط من غير فقد أو تكرار."
      : "\n🚨 فيه مشكلة حقيقية ظهرت فوق — دي أولوية قصوى، راجعها قبل أي خطوة تانية."
    );
    process.exitCode = allGood ? 0 : 1;
  } catch (err) {
    console.error("\n❌ حصل خطأ أثناء الاختبار:", err);
    process.exitCode = 1;
  } finally {
    await context.close().catch(() => {});
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main();
