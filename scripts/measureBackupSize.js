#!/usr/bin/env node
// scripts/measureBackupSize.js
//
// بيقيس حجم النسخة الاحتياطية الفعلي (نفس شكل الـ JSON اللي backupService.js
// بيخزّنه) لكل شركة (userId) في قاعدة البيانات الحقيقية، ويطبع تقرير مرتب
// من الأكبر للأصغر — عشان نعرف إحنا فعليًا على قد إيه من حد Firestore
// (~1,048,576 بايت للمستند) قبل ما نعتمد على backupService بشكله الجديد
// (اللي بيقسّم البيانات على "chunks" تلقائيًا لو قربت من الحد).
//
// الاستخدام:
//   1) npm install --no-save firebase-admin   (مش من ضمن dependencies بتاعة
//      التطبيق نفسه؛ السكريبت ده بيتشغل من جهازك بس مش جوه الـ app)
//   2) نزّل service account key من:
//      Firebase Console → Project Settings → Service Accounts → Generate new private key
//      وسيبه *برا* الريبو خالص (متحطوش جوه scripts/ ولا أي مكان تاني في
//      المشروع — الملف ده بيدّي صلاحية أدمن كاملة، ومتسيبوش يتنشر على GitHub!)
//   3) شغّله على كل الشركات:
//        node scripts/measureBackupSize.js /path/to/serviceAccountKey.json
//      أو على شركة واحدة بس (لو عايز تتأكد من حالة معينة):
//        node scripts/measureBackupSize.js /path/to/serviceAccountKey.json <userId>

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const keyPathArg = process.argv[2];
const onlyUserId = process.argv[3];
if (!keyPathArg || keyPathArg.startsWith("--")) {
  console.error("استخدام: node scripts/measureBackupSize.js <path-to-service-account.json> [userId]");
  process.exit(1);
}

initializeApp({ credential: cert(require(path.resolve(keyPathArg))) });
const db = getFirestore();

// نفس القائمة الموجودة في src/services/backupService.js (BACKUP_COLLECTIONS)
// — لازم الاتنين يتحدّثوا مع بعض لو اتضافت subcollection جديدة.
const BACKUP_COLLECTIONS = [
  "equipment", "jobs", "drivers", "maintenance", "payments",
  "supplierInvoices", "supplierPayments", "salaryEntries",
  "attendance", "custodyTransactions", "taxDeductions",
];

const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576; // حد Firestore الرسمي لأي مستند
const SAFE_CHUNK_BYTES          = 900_000;   // نفس BACKUP_CHUNK_BYTES في الكود

const byteLength = (str) => Buffer.byteLength(str, "utf8");

async function measureUser(userId) {
  const data = {};
  for (const sub of BACKUP_COLLECTIONS) {
    const snap = await db.collection("users").doc(userId).collection(sub).get();
    data[sub] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const settingsSnap = await db.collection("users").doc(userId).collection("meta").doc("settings").get();
  if (settingsSnap.exists) data.settings = settingsSnap.data();

  const jsonStr = JSON.stringify(data);
  const bytes = byteLength(jsonStr);
  const counts = Object.fromEntries(
    BACKUP_COLLECTIONS.map((sub) => [sub, data[sub].length])
  );
  return { userId, bytes, counts };
}

(async () => {
  let userIds;
  if (onlyUserId) {
    userIds = [onlyUserId];
  } else {
    const usersSnap = await db.collection("users").get();
    userIds = usersSnap.docs.map((d) => d.id);
  }

  console.log(`⏳ بيقيس حجم بيانات ${userIds.length} شركة...\n`);

  const results = [];
  for (const uid of userIds) {
    try {
      results.push(await measureUser(uid));
    } catch (err) {
      console.warn(`  ⚠️  فشل قياس ${uid}: ${err.message}`);
    }
  }

  results.sort((a, b) => b.bytes - a.bytes);

  console.log("النتيجة (من الأكبر للأصغر):\n");
  results.forEach(({ userId, bytes, counts }) => {
    const mb = (bytes / 1_048_576).toFixed(3);
    const pctOfLimit = ((bytes / FIRESTORE_DOC_LIMIT_BYTES) * 100).toFixed(1);
    const flag =
      bytes > SAFE_CHUNK_BYTES ? "  ⚠️  هيتقسّم على chunks (تجاوز الهامش الآمن)"
      : bytes > SAFE_CHUNK_BYTES * 0.5 ? "  ⚡ قريب نسبيًا من هامش الأمان"
      : "";
    console.log(`${userId}: ${bytes.toLocaleString()} بايت (${mb} MB) — ${pctOfLimit}% من حد المستند الواحد${flag}`);
    const countsLine = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k}=${n}`)
      .join(", ");
    if (countsLine) console.log(`    ${countsLine}`);
  });

  const totalOver = results.filter((r) => r.bytes > SAFE_CHUNK_BYTES).length;
  console.log(
    `\n${totalOver > 0
      ? `⚠️  ${totalOver} شركة تعدّت الهامش الآمن (${SAFE_CHUNK_BYTES.toLocaleString()} بايت) — هيتقسّموا على chunks تلقائيًا مع النسخة الجديدة من backupService.js.`
      : "✅ كل الشركات لسه تحت الهامش الآمن، مفيش حاجة هتتقسّم دلوقتي."}`
  );
})().catch((err) => {
  console.error("فشل القياس:", err);
  process.exit(1);
});
