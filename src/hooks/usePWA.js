// src/hooks/usePWA.js
import { useState, useEffect } from "react";

/**
 * Registers the service worker and exposes:
 * - isOnline: current network status
 * - installPrompt: function to trigger "Add to Home Screen"
 * - isInstalled: whether app is running as PWA
 */
export const usePWA = () => {
  const [isOnline,      setIsOnline]      = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled,   setIsInstalled]   = useState(false);

  useEffect(() => {
    // ملاحظة: تسجيل الـ service worker بقى بيحصل مرة واحدة بس، من
    // src/index.js (عن طريق serviceWorkerRegistration.register())، من أول
    // ما التطبيق يفتح — مش من هنا، ومش بعد تسجيل الدخول.

    // Check if running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Online/offline listeners
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture install prompt
    const handleInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handleInstall);

    return () => {
      window.removeEventListener("online",               handleOnline);
      window.removeEventListener("offline",              handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, []);

  const installPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return { isOnline, isInstalled, canInstall: !!deferredPrompt, installPrompt };
};
