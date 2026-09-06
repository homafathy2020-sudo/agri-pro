// src/features/landing/IntroSection.jsx
import React from "react";

const IntroSection = () => (
  <section className="py-16 sm:py-20 border-t border-white/8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-xs font-bold tracking-wide text-brand-400 uppercase">إيه هو زراعي برو</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-50 leading-snug">
          نظام واحد لإدارة شركات المعدات الزراعية — مش برنامج مزارع عام، ومش
          بديل إكسل بس.
        </h2>
        <p className="mt-5 text-gray-400 leading-relaxed">
          إحنا شفنا المشكلة دي بشكل حقيقي جوه شغل ميكنة زراعية، ومن هنا بدأنا
          نبني نظام يجمع المعلومات ويربطها ببعض بدل ما تفضل متفرقة.
        </p>
        <p className="mt-3 text-gray-400 leading-relaxed">
          زراعي برو بيساعد شركة الميكنة أو المعدات الزراعية تدير شغلها،
          معداتها، سواقينها، وحساباتها من مكان واحد — بدل ما كل واحدة من دول
          تكون في نظام أو دفتر لوحدها.
        </p>
      </div>
    </div>
  </section>
);

export default IntroSection;
