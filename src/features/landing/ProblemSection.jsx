// src/features/landing/ProblemSection.jsx
import React from "react";
import { Card } from "../../components/ui/Card";
import { PhoneIcon, ClipboardIcon, UsersGroupIcon, DownloadIcon } from "../../components/ui/Icons";

const SCATTERED = [
  { icon: <PhoneIcon />,      label: "واتساب" },
  { icon: <ClipboardIcon />,  label: "دفاتر وورق" },
  { icon: <DownloadIcon />,   label: "ملفات إكسل" },
  { icon: <UsersGroupIcon />, label: "أشخاص مختلفين" },
];

const ProblemSection = () => (
  <section id="problem" className="py-16 sm:py-20 border-t border-white/8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-50 leading-snug">
          الشغلانة في مكان، الحسابات في مكان، والبيانات على واتساب...
        </h2>
        <p className="mt-4 text-gray-400 leading-relaxed">
          كل ما شركتك تكبر — معدات أكتر، سواقين أكتر، عملاء أكتر — متابعة كل ده
          بيبقى أصعب: مين لسه مديك فلوس؟ السواق مستحق كام؟ العهدة راحت فين؟
          المعدة محتاجة صيانة إمتى؟ الإجابات موجودة... بس متفرقة، وبتاخد وقت
          عشان تلمّها.
        </p>
      </div>

      <div className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCATTERED.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-2.5 py-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center text-gray-400">
              {s.icon}
            </div>
            <span className="text-sm font-semibold text-gray-300">{s.label}</span>
          </Card>
        ))}
      </div>

      <div className="mt-9 rounded-3xl border border-brand-800/40 bg-gradient-to-l from-brand-900/25 to-transparent px-6 py-7 sm:px-9 sm:py-9">
        <p className="text-lg sm:text-2xl font-extrabold text-gray-50 leading-snug">
          المشكلة مش إن البيانات مش موجودة.
          <br className="hidden sm:block" />
          {" "}المشكلة إنها موجودة... في أماكن كتير.
        </p>
      </div>
    </div>
  </section>
);

export default ProblemSection;
