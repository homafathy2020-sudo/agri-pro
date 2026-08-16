// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// بيسجّل الـ service worker يخلي التطبيق (الشل بتاعه: JS/CSS/HTML) يتخزن
// على الجهاز من أول زيارة — حتى قبل ما المستخدم يسجل دخول — فيفتح ويشتغل
// حتى من غير نت خالص من بعد كده.
serviceWorkerRegistration.register();

// اطلب من المتصفح إن مساحة التخزين المحلي (اللي فيها كل بيانات
// Firestore الأوف لاين + التعديلات اللي لسه مترفعتش) تبقى "persistent"
// بدل "best-effort". الفرق: بدون الطلب ده، المتصفح (خصوصًا على أندرويد)
// ممكن يمسح جزء من التخزين المحلي تلقائيًا لو الجهاز بقى شغال بمساحة
// قليلة جدًا — حتى لو التطبيق ده مقفول. الطلب ده مش مضمون 100% (بيرجع
// true/false حسب المتصفح وتاريخ استخدام المستخدم للموقع)، لكنه بيقلل
// احتمال فقدان البيانات في الحالات دي بشكل كبير.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    // Silent — this is a best-effort request, not something to bother the
    // user about. If it's rejected, offline data is still safe under
    // normal conditions; only extreme low-disk-space scenarios are at risk.
  });
}
