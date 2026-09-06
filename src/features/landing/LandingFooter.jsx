// src/features/landing/LandingFooter.jsx
import React from "react";

const LandingFooter = () => (
  <footer className="border-t border-white/8 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <img src="/brand-icon.png" alt="زراعي برو" className="w-7 h-7 rounded-lg" />
        <span className="text-sm font-bold text-gray-300">زراعي برو</span>
      </div>
      <p className="text-xs text-gray-600">بيانات أوضح. قرارات أذكى. أرباح أكبر.</p>
    </div>
  </footer>
);

export default LandingFooter;
