// scripts/seedLoadTestCompanies.js
//
// بيعمل (أو يحدّث) N شركة تجريبية منفصلة تمامًا عن بعض (زي ما لو كانت
// شركات حقيقية مختلفة مسجلة في التطبيق)، كل واحدة ببيانات واقعية-الشكل
// تغطي حوالي سنة كاملة عبر كل الموديولات — عشان نختبر هل التطبيق
// "هيستحمل" فعلاً لما عدد كبير من الشركات يستخدموه ويكون عندهم بيانات
// حقيقية متراكمة، مش بس حساب تجريبي واحد صغير زي seedDemoAccount.js.
//
// ============================================================================
// أهم حاجة: السكريبت ده بيشتغل بس على مشروع my-app-load-test (التجريبي)،
// ومفيش أي مكان فيه بيلمس المشروع الحقيقي (agri-pro-2b607) أو بيانات
// عميلك الفعلي — كل شركة هنا حساب Firebase Auth منفصل بإيميل تجريبي
// (loadtest-co-XX@agripro-test.local)، وكل بياناتها تحت users/{uid}/...
// بنفس البنية الحالية بالظبط، من غير أي تغيير في الـ schema أو الـ rules.
// ============================================================================
//
// طريقة التشغيل:
// ------------------------------------------------------
//   node scripts/seedLoadTestCompanies.js scripts/serviceAccountKey.json [عدد الشركات] [باسورد]
//
// مثال (القيم الافتراضية أصلاً 50 شركة وباسورد موحد):
//   node scripts/seedLoadTestCompanies.js scripts/serviceAccountKey.json
//   node scripts/seedLoadTestCompanies.js scripts/serviceAccountKey.json 20
//
// السكريبت idempotent بالكامل زي seedDemoAccount.js بالظبط: كل مستند
// ليه id ثابت مبني على رقم الشركة (lt01-job-042 مثلاً)، فتشغيله تاني
// بيحدّث نفس البيانات (merge) بدل ما يكررها أو يضاعفها. آمن تشغّله أد ما
// تحب.
//
// بيانات الدخول لكل شركة (بعد ما السكريبت يخلص):
//   الإيميل : loadtest-co-01@agripro-test.local  (لحد loadtest-co-50@...)
//   الباسورد: LoadTest@2026  (أو اللي حددته كـ argument رابع)

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const path = require("path");

const keyPathArg = process.argv[2];
if (!keyPathArg) {
  console.error(
    "استخدام: node scripts/seedLoadTestCompanies.js <path-to-service-account.json> [عدد الشركات=50] [باسورد]"
  );
  process.exit(1);
}
const COMPANY_COUNT = Math.max(1, Number(process.argv[3]) || 50);
const PASSWORD = process.argv[4] || "LoadTest@2026";
const EMAIL_DOMAIN = "agripro-test.local";

const serviceAccount = require(path.resolve(keyPathArg));

// حماية إضافية: امنع تشغيل السكريبت ده بالغلط على أي مشروع غير
// my-app-load-test، حتى لو حد غيّر مسار المفتاح بالغلط.
if (serviceAccount.project_id !== "my-app-load-test") {
  console.error(
    `❌ المفتاح ده بتاع مشروع "${serviceAccount.project_id}"، مش "my-app-load-test". ` +
    `السكريبت ده اتعمل يشتغل بس على المشروع التجريبي — وقف هنا عشان الأمان.`
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

// ─── RNG بذرة ثابتة لكل شركة (نفس رقم الشركة = نفس البيانات بالظبط في كل
// تشغيل — reproducible، مش عشوائي حقيقي) ───────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (rng, arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};
const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
const pad2 = (n) => String(n).padStart(2, "0");

// ─── بيانات مرجعية واقعية-الشكل نسحب منها عشوائيًا (بذرة ثابتة) ─────────
const FIRST_NAMES = [
  "محمد", "أحمد", "علي", "عبد الرحمن", "كريم", "سامي", "مصطفى", "حسن",
  "إبراهيم", "خالد", "سيد", "يوسف", "عمر", "طارق", "رمضان",
];
const LAST_NAMES = [
  "علي حسن", "سيد إبراهيم", "صابر عبده", "فتحي عبد الله", "جمال عثمان",
  "السيد محمود", "عبد العزيز", "النجار", "الفار", "حسنين", "شحاتة", "عبد الوهاب",
];
const CLIENT_NAMES = [
  "عزبة الشيخ سالم", "مزرعة النيل الأخضر", "شركة الوادي الأخضر للاستصلاح",
  "أحمد الفار", "مصطفى عبد الله", "عزبة العائلة الكبيرة", "مزارع الدلتا الحديثة",
  "شركة الأرض الطيبة", "عزبة أبو النجا", "مزرعة الأمل", "شركة الفردوس الزراعية",
  "عزبة بني سويف", "مزارع الصعيد المتحدة", "شركة النخيل للاستثمار الزراعي",
];
const WORK_TYPES = [
  "المحراث", "الدسك", "كومباين", "الرشاشة", "بلانتر ذرة", "القلاب",
  "هولمر حصاد", "معدة تسوية", "بلانتر بنجر", "بدارة خدمة",
];
const EQUIPMENT_TEMPLATES_BASE = [
  { name: "جرار ماسي فيرجسون 290", type: "جرار", fuelRate: 5 },
  { name: "جرار نيوهولاند TD95", type: "جرار", fuelRate: 4.5 },
  { name: "جرار كيس IH", type: "جرار", fuelRate: 4.8 },
  { name: "حصادة كلاس دومينيتور", type: "حصادة", fuelRate: 9 },
  { name: "حصادة جون دير", type: "حصادة", fuelRate: 8.5 },
];
const EQUIPMENT_TEMPLATES_ATTACHMENT = [
  { name: "محراث قلاب 5 سلاح", type: "معدة حرث" },
  { name: "دسك ثقيل 24 قرص", type: "معدة حرث" },
  { name: "رشاشة معلقة 400 لتر", type: "معدة زراعة" },
  { name: "بلانتر ذرة 4 خطوط", type: "معدة زراعة" },
  { name: "معدة تسوية ليزر", type: "معدة تسوية" },
];
const MAINTENANCE_TYPES = ["تغيير زيت", "إطارات", "فلاتر", "ميكانيكي", "بطارية", "صيانة عامة", "كهرباء"];
const SUPPLIER_NAMES = [
  "ورشة الحاج سيد", "مصنع قطع غيار الفلاحين", "توريد سولار الوادي",
  "ورشة اللحام الحديث", "مضخات ومعدات الري", "محل إطارات المزارع",
  "توكيل قطع غيار ماسي فيرجسون",
];
const TAX_TYPES = ["tax", "gov_fee", "fine", "other"];

// كل مستندات الـ seed ليها IDs ثابتة (lt{NN}-...) عشان تشغيل السكريبت
// تاني على نفس الشركة يحدّث نفس البيانات بدل ما يكررها. Firestore بيرفض
// أكتر من 500 عملية في نفس الـ batch، فبنقسّم لدفعات آمنة.
async function commitInChunks(writes, chunkSize = 400) {
  for (let i = 0; i < writes.length; i += chunkSize) {
    const batch = db.batch();
    writes.slice(i, i + chunkSize).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
  }
}

async function seedCompany(companyIndex) {
  const tag = pad2(companyIndex);
  const email = `loadtest-co-${tag}@${EMAIL_DOMAIN}`;
  const rng = mulberry32(companyIndex * 1000003 + 7);
  const idPrefix = `lt${tag}`;

  // ── حساب Firebase Auth (نفس منطق seedDemoAccount.js بالظبط) ───────────
  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: PASSWORD, displayName: `شركة تجريبية ${tag}` });
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    const created = await auth.createUser({
      email, password: PASSWORD, displayName: `شركة تجريبية ${tag}`, emailVerified: true,
    });
    uid = created.uid;
  }

  const userDoc = db.collection("users").doc(uid);
  const writes = [];
  const addWrite = (ref, data) => writes.push({ ref, data });

  // ── بروفايل + إعدادات ─────────────────────────────────────────────────
  addWrite(userDoc, {
    uid, email, displayName: `شركة تجريبية ${tag}`,
    createdAt: Timestamp.now(), lastActiveAt: Timestamp.now(), isLoadTest: true,
  });
  const fuelPrice = 12 + randInt(rng, 0, 4);
  addWrite(userDoc.collection("meta").doc("settings"), { fuelPrice, updatedAt: Timestamp.now() });

  // ── السائقون (6 لكل شركة، واحد منهم غير نشط) ───────────────────────────
  const driverCount = 6;
  const drivers = [];
  for (let i = 1; i <= driverCount; i++) {
    drivers.push({
      id: `${idPrefix}-driver-${i}`,
      name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      phone: `010${randInt(rng, 10000000, 99999999)}`,
      status: i === driverCount ? "inactive" : "active",
      salary: 3800 + randInt(rng, 0, 9) * 100,
    });
  }
  drivers.forEach((d) => addWrite(userDoc.collection("drivers").doc(d.id), {
    ...d, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  }));
  const activeDrivers = drivers.filter((d) => d.status === "active");

  // ── المعدات (5 أساسية + 3 ملحقات) ───────────────────────────────────────
  const equipment = [];
  EQUIPMENT_TEMPLATES_BASE.forEach((t, i) => {
    equipment.push({
      id: `${idPrefix}-eq-${i + 1}`, category: "base", name: t.name, type: t.type,
      driverId: activeDrivers[i % activeDrivers.length]?.id || "", customDriverName: "",
      fuelRate: t.fuelRate, parentEquipmentId: "", customParentName: "",
      status: "active", lastGreaseDate: "", greaseHistory: [], lastOilChangeMeter: randInt(rng, 200, 1500), oilChangeHistory: [],
    });
  });
  pickN(rng, EQUIPMENT_TEMPLATES_ATTACHMENT, 3).forEach((t, i) => {
    const parent = equipment[i % EQUIPMENT_TEMPLATES_BASE.length];
    equipment.push({
      id: `${idPrefix}-eq-${EQUIPMENT_TEMPLATES_BASE.length + i + 1}`, category: "attachment",
      name: t.name, type: t.type, driverId: "", customDriverName: "",
      fuelRate: 0, parentEquipmentId: parent.id, customParentName: "",
      status: rng() < 0.15 ? "maintenance" : "active",
      lastGreaseDate: daysAgoISO(randInt(rng, 5, 60)), greaseHistory: [],
      lastOilChangeMeter: "", oilChangeHistory: [],
    });
  });
  equipment.forEach((e) => addWrite(userDoc.collection("equipment").doc(e.id), {
    ...e, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  }));
  const baseEquipment = equipment.filter((e) => e.category === "base");

  // ── الشغلانات على مدار سنة كاملة (~180 عملية، 3-4 كل أسبوع) ────────────
  const JOB_COUNT = 180;
  const jobs = [];
  for (let i = 1; i <= JOB_COUNT; i++) {
    const eq = pick(rng, baseEquipment);
    const acres = randInt(rng, 4, 25);
    const pricePerAcre = 180 + randInt(rng, 0, 14) * 10;
    jobs.push({
      id: `${idPrefix}-job-${String(i).padStart(3, "0")}`,
      equipmentId: eq.id,
      driverId: eq.driverId || pick(rng, activeDrivers).id,
      client: pick(rng, CLIENT_NAMES),
      workType: pick(rng, WORK_TYPES),
      acres, pricePerAcre,
      fuelUsed: Math.round(acres * eq.fuelRate * (0.8 + rng() * 0.4)),
      date: daysAgoISO(Math.floor((i / JOB_COUNT) * 364) + randInt(rng, 0, 2)),
      notes: "", amountPaid: 0,
    });
  }
  jobs.forEach((j) => addWrite(userDoc.collection("jobs").doc(j.id), {
    ...j, createdAt: new Date().toISOString(), updatedAt: Timestamp.now(),
  }));

  // ── الدفعات — ~90% من العمليات القديمة (قبل آخر 10 أيام) بيتقفلوا كامل
  // أو جزئي، الأحدث لسه من غير تحصيل — نفس الواقعية اللي في seedDemoAccount ──
  let paymentSeq = 1;
  const payments = [];
  jobs.forEach((j) => {
    const total = j.acres * j.pricePerAcre;
    const daysOld = Math.round((Date.now() - new Date(j.date).getTime()) / 86400000);
    if (daysOld < 10) return; // شغلانة حديثة جدًا، لسه من غير تحصيل، زي الواقع
    const roll = rng();
    if (roll < 0.08) return; // نسبة صغيرة فعلاً متأخرة الدفع بالكامل (ديون حقيقية)
    if (roll < 0.35) {
      // دفعة جزئية واحدة
      payments.push({
        id: `${idPrefix}-pay-${String(paymentSeq++).padStart(3, "0")}`,
        jobId: j.id, amount: Math.round(total * (0.3 + rng() * 0.4)),
        date: daysAgoISO(daysOld - randInt(rng, 1, 5)), notes: "دفعة تحت الحساب",
      });
    } else {
      // سداد كامل (أحيانًا على دفعتين)
      if (rng() < 0.3) {
        const first = Math.round(total * 0.5);
        payments.push({
          id: `${idPrefix}-pay-${String(paymentSeq++).padStart(3, "0")}`,
          jobId: j.id, amount: first, date: daysAgoISO(daysOld - 2), notes: "دفعة أولى",
        });
        payments.push({
          id: `${idPrefix}-pay-${String(paymentSeq++).padStart(3, "0")}`,
          jobId: j.id, amount: total - first, date: daysAgoISO(Math.max(0, daysOld - 8)), notes: "سداد باقي المبلغ",
        });
      } else {
        payments.push({
          id: `${idPrefix}-pay-${String(paymentSeq++).padStart(3, "0")}`,
          jobId: j.id, amount: total, date: daysAgoISO(daysOld - 3), notes: "سداد كامل",
        });
      }
    }
  });
  payments.forEach((p) => addWrite(userDoc.collection("payments").doc(p.id), {
    ...p, createdAt: new Date().toISOString(),
  }));

  // ── الصيانة (~15 على مدار السنة) ────────────────────────────────────────
  for (let i = 1; i <= 15; i++) {
    addWrite(userDoc.collection("maintenance").doc(`${idPrefix}-maint-${i}`), {
      equipmentId: pick(rng, equipment).id, type: pick(rng, MAINTENANCE_TYPES),
      cost: 300 + randInt(rng, 0, 30) * 100, date: daysAgoISO(randInt(rng, 0, 360)), notes: "",
      createdAt: new Date().toISOString(), updatedAt: Timestamp.now(),
    });
  }

  // ── الرواتب — راتب أساسي شهري لكل سائق على مدار 12 شهر + مكافآت/سلف
  // متفرقة (~14 قيد لكل سائق تقريبًا) ─────────────────────────────────────
  let salarySeq = 1;
  drivers.forEach((d) => {
    for (let m = 0; m < 12; m++) {
      addWrite(userDoc.collection("salaryEntries").doc(`${idPrefix}-sal-${String(salarySeq++).padStart(3, "0")}`), {
        driverId: d.id, type: "base", amount: d.salary, date: daysAgoISO(m * 30 + randInt(rng, 0, 3)),
        reason: "راتب شهري", notes: "", paid: true,
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      });
    }
    const extras = randInt(rng, 1, 3);
    for (let e = 0; e < extras; e++) {
      const type = pick(rng, ["bonus", "advance", "deduction"]);
      addWrite(userDoc.collection("salaryEntries").doc(`${idPrefix}-sal-${String(salarySeq++).padStart(3, "0")}`), {
        driverId: d.id, type, amount: 200 + randInt(rng, 0, 8) * 100,
        date: daysAgoISO(randInt(rng, 0, 360)),
        reason: type === "bonus" ? "حافز أداء" : type === "advance" ? "سلفة" : "خصم تأخير",
        notes: "", paid: true, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      });
    }
  });

  // ── الحضور والغياب — آخر 30 يوم لكل سائق نشط ───────────────────────────
  const attendanceStatuses = ["present", "present", "present", "present", "late", "absent", "half"];
  activeDrivers.forEach((d, di) => {
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      addWrite(userDoc.collection("attendance").doc(`${idPrefix}-att-${di + 1}-${dayOffset}`), {
        driverId: d.id, date: daysAgoISO(dayOffset),
        status: attendanceStatuses[(dayOffset + di) % attendanceStatuses.length], notes: "",
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      });
    }
  });

  // ── العهدة — إيداع شهري + مصاريف متفرقة ────────────────────────────────
  let custodySeq = 1;
  for (let m = 0; m < 12; m++) {
    addWrite(userDoc.collection("custodyTransactions").doc(`${idPrefix}-cust-${String(custodySeq++).padStart(3, "0")}`), {
      type: "deposit", amount: 45000 + randInt(rng, 0, 100) * 100, date: daysAgoISO(m * 30),
      source: "صاحب الشركة", notes: "عهدة الشهر",
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  }
  for (let i = 0; i < 10; i++) {
    const category = pick(rng, ["equipment", "driver", "other"]);
    const base = { type: "expense", category, amount: 200 + randInt(rng, 0, 30) * 100, date: daysAgoISO(randInt(rng, 0, 360)), notes: "" };
    if (category === "equipment") base.equipmentId = pick(rng, equipment).id;
    if (category === "driver") base.driverId = pick(rng, drivers).id;
    if (category === "other") base.otherLabel = "مصاريف تشغيل متنوعة";
    addWrite(userDoc.collection("custodyTransactions").doc(`${idPrefix}-cust-${String(custodySeq++).padStart(3, "0")}`), {
      ...base, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  }

  // ── فواتير الموردين + مدفوعاتها ─────────────────────────────────────────
  const supplierInvoices = [];
  for (let i = 1; i <= 20; i++) {
    supplierInvoices.push({
      id: `${idPrefix}-sinv-${String(i).padStart(2, "0")}`,
      supplierName: pick(rng, SUPPLIER_NAMES), description: "توريد/خدمة",
      amount: 300 + randInt(rng, 0, 40) * 100, date: daysAgoISO(randInt(rng, 0, 360)), notes: "",
    });
  }
  supplierInvoices.forEach((inv) => addWrite(userDoc.collection("supplierInvoices").doc(inv.id), {
    ...inv, createdAt: new Date().toISOString(), updatedAt: Timestamp.now(),
  }));
  let supPaySeq = 1;
  supplierInvoices.forEach((inv) => {
    if (rng() < 0.75) {
      const full = rng() < 0.6;
      addWrite(userDoc.collection("supplierPayments").doc(`${idPrefix}-spay-${String(supPaySeq++).padStart(2, "0")}`), {
        supplierInvoiceId: inv.id, amount: full ? inv.amount : Math.round(inv.amount * 0.5),
        date: daysAgoISO(Math.max(0, randInt(rng, 0, 360) - 5)), notes: full ? "سداد كامل" : "دفعة جزئية",
        createdAt: new Date().toISOString(),
      });
    }
  });

  // ── ضرائب وخصومات ───────────────────────────────────────────────────────
  for (let i = 1; i <= 8; i++) {
    const type = pick(rng, TAX_TYPES);
    const data = { type, amount: 150 + randInt(rng, 0, 20) * 50, date: daysAgoISO(randInt(rng, 0, 360)), notes: "" };
    if (type === "other") data.otherLabel = "خصم إداري";
    addWrite(userDoc.collection("taxDeductions").doc(`${idPrefix}-tax-${i}`), {
      ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  }

  await commitInChunks(writes);

  return {
    email, uid,
    counts: {
      drivers: drivers.length, equipment: equipment.length, jobs: jobs.length,
      payments: payments.length, maintenance: 15, salaryEntries: salarySeq - 1,
      attendance: activeDrivers.length * 30, custody: custodySeq - 1,
      supplierInvoices: supplierInvoices.length, supplierPayments: supPaySeq - 1, taxDeductions: 8,
    },
  };
}

async function main() {
  console.log(`جاري زرع ${COMPANY_COUNT} شركة تجريبية في my-app-load-test...\n`);
  let totalDocs = 0;
  for (let i = 1; i <= COMPANY_COUNT; i++) {
    const start = Date.now();
    const result = await seedCompany(i);
    const docsThisCompany = Object.values(result.counts).reduce((a, b) => a + b, 0) + 2; // +profile +settings
    totalDocs += docsThisCompany;
    console.log(
      `[${i}/${COMPANY_COUNT}] ${result.email} — ${docsThisCompany} مستند — ${Date.now() - start}ms`
    );
  }
  console.log(`\n✅ خلص زرع ${COMPANY_COUNT} شركة — إجمالي تقريبي: ${totalDocs} مستند.`);
  console.log(`\nبيانات الدخول: loadtest-co-01@${EMAIL_DOMAIN} ... loadtest-co-${pad2(COMPANY_COUNT)}@${EMAIL_DOMAIN}`);
  console.log(`الباسورد لكل الشركات: ${PASSWORD}`);
}

main().catch((err) => {
  console.error("❌ حصل خطأ أثناء الـ seed:", err);
  process.exit(1);
});
