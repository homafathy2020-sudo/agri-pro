// src/features/profile/Section.jsx
//
// غلاف صغير قابل لإعادة الاستخدام لأقسام نافذة الملف الشخصي — منقول هنا
// حرفيًا من ProfileModal.jsx من غير أي تغيير في السلوك أو الشكل.
import React from "react";

const Section = ({ icon, title, children }) => (
  <div className="bg-surface-2 border border-white/8 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-brand-400">{icon}</span>
      <h3 className="text-sm font-bold text-gray-200">{title}</h3>
    </div>
    {children}
  </div>
);

export default Section;
