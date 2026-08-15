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
