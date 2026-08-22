// src/utils/globalErrorLogger.js
// ─────────────────────────────────────────────────────────
// React's ErrorBoundary بيلقط أخطاء الـ render بس. الأخطاء اللي بتحصل
// جوه event handlers (onClick مثلاً) أو async functions أو promises
// من غير catch — دول بيهربوا منه تماماً وممكن تعدي بصمت. الملف ده
// بيسمع على مستوى الـ window كله عشان يمسكهم.
// بيتنادى مرة واحدة بس من index.js.
// ─────────────────────────────────────────────────────────
import { errorLogService } from "../services/errorLogService";

export const initGlobalErrorLogger = () => {
  window.addEventListener("error", (event) => {
    errorLogService.log({
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      source: "window",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    errorLogService.log({
      message: reason?.message || String(reason),
      stack: reason?.stack,
      source: "promise",
    });
  });
};
