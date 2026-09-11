// src/services/alertService.js
//
// audit finding F-017: الطبقة اللي بتحوّل errorLogs من سجل "سلبي" (يتكتب
// في Firestore ويتقرا يدوي بس لما الأدمن يفتح /admin/errors) إلى تنبيه
// "حي" فعلي بيوصل للأدمن من غير ما يفتح لوحة الأدمن أصلاً — Slack أو
// Discord webhook (حسب اللي مُعد في src/config/constants/alerts.js).
//
// best-effort بالكامل زي errorLogService بالظبط: فشل إرسال تنبيه (رابط
// غلط، الشبكة واقعة، الـ webhook اتحذف) مالوش معنى إنه يكسر أي حاجة
// تانية في التطبيق، أو حتى يمنع تسجيل الخطأ الأصلي في Firestore. الدالة
// دي أبداً مبتـ throw، ومحدش المفروض ينتظرها (fire-and-forget).
//
// ⚠️ حد صريح موثّق عمداً: التنبيه بيتبعت من متصفح المستخدم نفسه (client
// -side fetch) مباشرة لـ webhook خارجي — مفيش خادم وسيط. رابط الـ webhook
// بالتالي موجود في الكود اللي بيوصل لمتصفح أي مستخدم مسجل دخول. ده مش
// سر بنفس حساسية مفتاح API (أسوأ استغلال ممكن هو حد يبعت رسائل مزيفة
// للقناة، مش وصول لأي بيانات أو حساب)، لكنه لازم يتوثق كقرار واعي مش
// سهو. لو ده غير مقبول لحجم إنتاج حقيقي أكبر مستقبلاً، الحل الصحيح طويل
// المدى هو Cloud Function وسيطة تستقبل الخطأ وتبعت هي الـ webhook، بدل
// ما الفرونت يكلّمه مباشرة.
import { ADMIN_ALERT_WEBHOOK_URL, ALERT_DEDUP_WINDOW_MS } from "../config/constants/alerts";

const dedupKey = (signature) => `adminAlertSentAt:${signature}`;

const alreadySentRecently = (signature) => {
  try {
    const last = Number(localStorage.getItem(dedupKey(signature)) || 0);
    return Date.now() - last < ALERT_DEDUP_WINDOW_MS;
  } catch {
    return false; // لو التخزين معطّل، منمنعش التنبيه عشان مشكلة تخزين جانبية
  }
};

const markSent = (signature) => {
  try { localStorage.setItem(dedupKey(signature), String(Date.now())); } catch {}
};

// Discord محتاج { content }، بينما Slack (وأغلب أدوات الـ webhook العامة
// المتوافقة معاه) محتاجة { text } — كشف بسيط من شكل الرابط نفسه بدل ما
// نحمّل المستخدم إعداد إضافي لمجرد اختيار المنصة.
const buildPayload = (url, text) =>
  url.includes("discord.com") ? { content: text } : { text };

export const alertService = {
  /**
   * بتبعت تنبيه حي لقناة خارجية (Slack/Discord webhook) لو مُعدة في
   * ADMIN_ALERT_WEBHOOK_URL — وإلا no-op فوري ومتعمّد. `signature`
   * اختيارية: توقيع مختصر يمنع تكرار نفس التنبيه بالظبط خلال
   * ALERT_DEDUP_WINDOW_MS (افتراضيًا مشتق من title+message).
   */
  notifyAdmin: ({ title, message, context = {}, signature } = {}) => {
    if (!ADMIN_ALERT_WEBHOOK_URL) return;

    const sig = signature || `${title}:${message}`.slice(0, 100);
    if (alreadySentRecently(sig)) return;
    markSent(sig);

    const contextLines = Object.entries(context)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const text = [`🚨 ${title}`, message, contextLines].filter(Boolean).join("\n\n");

    fetch(ADMIN_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(ADMIN_ALERT_WEBHOOK_URL, text)),
    }).catch(() => {
      // best-effort — لو الإرسال فشل، مفيش أي مستخدم لازم يعرف أو يتأثر.
    });
  },
};
