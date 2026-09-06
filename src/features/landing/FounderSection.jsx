// src/features/landing/FounderSection.jsx
import React from "react";
import { Card } from "../../components/ui/Card";

const FounderSection = () => (
  <section id="story" className="py-16 sm:py-20 border-t border-white/8 bg-surface/40">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Card className="p-7 sm:p-10 max-w-3xl">
        <span className="text-xs font-bold tracking-wide text-brand-400 uppercase">قصتنا</span>
        <p className="mt-4 text-gray-300 leading-loose">
          إحنا عندنا نشاط في الميكنة الزراعية، وكان فيه شخص في العيلة مسؤول عن
          الحسابات ومتابعة تفاصيل كتير من الشغل. المعلومات كانت موزعة بين
          واتساب، الورق، والدفاتر — وكان صعب إنك تتابع كل حاجة في نفس الوقت.
        </p>
        <p className="mt-4 text-gray-300 leading-loose">
          من هنا جت فكرة إننا نبني نظام يجمع المعلومات دي ويربطها ببعض، ويساعد
          في فهم الشغل والحسابات والديون والمصروفات والمعدات بشكل أوضح.
        </p>
      </Card>
    </div>
  </section>
);

export default FounderSection;
