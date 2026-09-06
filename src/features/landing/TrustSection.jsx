// src/features/landing/TrustSection.jsx
import React from "react";
import { Card } from "../../components/ui/Card";
import { ShieldIcon, RestoreIcon, DownloadIcon, CloudUploadIcon } from "../../components/ui/Icons";

const POINTS = [
  { icon: <CloudUploadIcon />, title: "نسخة احتياطية يومية", body: "نسخة كاملة من بياناتك بتتاخد أوتوماتيك كل 24 ساعة." },
  { icon: <RestoreIcon />,     title: "استرجاع وقت ما تحتاج", body: "لو حصل أي حاجة، تقدر ترجع لنسخة سابقة بسهولة." },
  { icon: <DownloadIcon />,    title: "نسخة تاخدها معاك",     body: "تصدير محلي لبياناتك على جهازك، مش على السحابة بس." },
  { icon: <ShieldIcon />,      title: "بياناتك ليك وحدك",     body: "بيانات كل شركة معزولة تمامًا عن أي شركة تانية." },
];

const TrustSection = () => (
  <section className="py-16 sm:py-20 border-t border-white/8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl mb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-50">اتعمل من مشكلة حقيقية</h2>
        <p className="mt-4 text-gray-400 leading-relaxed">
          زراعي برو منتج حقيقي شغال، مبني من مشكلة اتعاشت فعلًا في شغل ميكنة
          زراعية — مش فكرة على الورق.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {POINTS.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-brand-400 mb-3">
              {p.icon}
            </div>
            <h3 className="text-sm font-bold text-gray-100">{p.title}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{p.body}</p>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
