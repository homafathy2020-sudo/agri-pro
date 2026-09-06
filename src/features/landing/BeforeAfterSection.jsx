// src/features/landing/BeforeAfterSection.jsx
import React from "react";
import { Card } from "../../components/ui/Card";
import { XCircleIcon, CheckCircleIcon } from "../../components/ui/Icons";

const BEFORE = [
  "ورق ودفاتر",
  "بيانات على واتساب",
  "ملفات إكسل متفرقة",
  "المعلومة موجودة مع شخص معين",
  "وقت في البحث والمتابعة",
];

const AFTER = [
  "بيانات منظمة في نظام واحد",
  "معلومات مترابطة ببعض",
  "متابعة أسهل وأسرع",
  "رؤية أوضح لحالة الشركة",
  "تقارير جاهزة بدل ما تتلمّ يدوي",
];

const BeforeAfterSection = () => (
  <section className="py-16 sm:py-20 border-t border-white/8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-50">الفرق قبل وبعد</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6 sm:p-7">
          <span className="text-xs font-bold tracking-wide text-gray-500 uppercase">قبل</span>
          <ul className="mt-4 space-y-3">
            {BEFORE.map((b) => (
              <li key={b} className="flex items-center gap-3 text-gray-400">
                <XCircleIcon size={18} className="text-gray-600 shrink-0" />
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 sm:p-7 border-brand-800/40">
          <span className="text-xs font-bold tracking-wide text-brand-400 uppercase">مع زراعي برو</span>
          <ul className="mt-4 space-y-3">
            {AFTER.map((a) => (
              <li key={a} className="flex items-center gap-3 text-gray-200">
                <CheckCircleIcon size={18} className="text-brand-500 shrink-0" />
                <span className="text-sm font-semibold">{a}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  </section>
);

export default BeforeAfterSection;
