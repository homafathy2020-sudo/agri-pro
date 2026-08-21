// scripts/backfillUserProfiles.js
//
// السبب إن الحسابات القديمة مش ظاهرة في عدّاد الأدمن:
// ------------------------------------------------------
// عدّاد صفحة الأدمن بيعتمد على مجموعة Firestore اسمها `users/{uid}`،
// والمستند ده بيتكتب أول مرة بس وقت التسجيل (register) أو أول تسجيل
// دخول بعد إضافة الميزة دي (touchLastActive في AuthContext.jsx).
// يعني أي حساب اتسجل *قبل* إضافة الميزة دي، ومش رجع فتح التطبيق تاني
// من ساعتها، معندوش مستند في `users` أصلاً — مش مشكلة قراءة أو صلاحيات،
// المستند نفسه مش موجود، فمش بيتحسب في العدّاد.
//
// الحل: سكريبت لمرة واحدة بيدور على كل حسابات Firebase Authentication
// (المصدر الحقيقي لكل الحسابات المسجلة) وبينشئ مستند `users/{uid}` لأي
// حساب ناقصه، باستخدام بيانات الحساب نفسه (تاريخ الإنشاء، الإيميل، الاسم).
//
// طريقة التشغيل:
// ------------------------------------------------------
// 1) من Firebase Console: Project settings → Service accounts →
//    Generate new private key. هيحمّلك ملف .json — سيبه برا الـ git
//    (متضيفوش أبداً للريبو)، مثلاً في نفس فولدر الـ scripts باسم
//    serviceAccountKey.json.
//
// 2) ثبّت firebase-admin مرة واحدة (مش من ضمن dependencies بتاعة
//    التطبيق نفسه، السكريبت ده بيتشغل من جهازك بس مش جوه الـ app):
//      npm install --no-save firebase-admin
//
// 3) شغّل السكريبت:
//      node scripts/backfillUserProfiles.js ./serviceAccountKey.json
//
// السكريبت بيطبع تقرير في الآخر (كام حساب كانوا ناقصين واتضافوا)،
// ومش بيلمس أي مستند موجود بالفعل (بيتخطاه لو لقاه).

// ملحوظة: بنستخدم هنا الـ "modular API" الجديدة بتاعة firebase-admin
// (initializeApp/getAuth/getFirestore من subpaths منفصلة) بدل الطريقة
// القديمة admin.credential.cert(...) — أضمن مع النسخ الحديثة من الحزمة.
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const path = require("path");

const keyPathArg = process.argv[2];
if (!keyPathArg) {
  console.error("استخدام: node scripts/backfillUserProfiles.js <path-to-service-account.json>");
  process.exit(1);
}

const serviceAccount = require(path.resolve(keyPathArg));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const USERS_COLLECTION = "users";

async function listAllAuthUsers() {
  const all = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    all.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return all;
}

async function main() {
  console.log("بجيب كل حسابات Firebase Authentication...");
  const authUsers = await listAllAuthUsers();
  console.log(`لقيت ${authUsers.length} حساب في Authentication.`);

  let created = 0;
  let skipped = 0;

  // على دفعات (batch) بدل مستند مستند، أسرع وأوفر على الكوتة.
  const BATCH_SIZE = 400;
  for (let i = 0; i < authUsers.length; i += BATCH_SIZE) {
    const chunk = authUsers.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let batchHasWrites = false;

    for (const u of chunk) {
      const ref = db.collection(USERS_COLLECTION).doc(u.uid);
      const existing = await ref.get();
      if (existing.exists) {
        skipped++;
        continue;
      }
      batch.set(ref, {
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        createdAt: Timestamp.fromDate(new Date(u.metadata.creationTime)),
        lastActiveAt: u.metadata.lastSignInTime
          ? Timestamp.fromDate(new Date(u.metadata.lastSignInTime))
          : Timestamp.fromDate(new Date(u.metadata.creationTime)),
      });
      batchHasWrites = true;
      created++;
    }

    if (batchHasWrites) await batch.commit();
    console.log(`اتعالج ${Math.min(i + BATCH_SIZE, authUsers.length)} / ${authUsers.length}...`);
  }

  console.log("----------------------------------------");
  console.log(`تم. اتضاف ${created} مستند جديد، وكان موجود بالفعل ${skipped}.`);
  console.log("دلوقتي عدّاد صفحة الأدمن هيطلع بالرقم الصح.");
}

main().catch((err) => {
  console.error("السكريبت فشل:", err);
  process.exit(1);
});
