// src/features/landing/DashboardSection.jsx
import React from "react";
import { StatCard, Card } from "../../components/ui/Card";
import { RevenueIcon, FuelIcon, ProfitIcon, WrenchIcon, DriverIcon, ReceiptIcon } from "../../components/ui/Icons";

const DashboardSection = () => (
  <section id="dashboard" className="py-16 sm:py-20 border-t border-white/8 bg-surface/40">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-50">
          بدل ما تجمع الأرقام، خلي الصورة قدامك
        </h2>
        <p className="mt-4 text-gray-400 leading-relaxed">
          لوحة التحكم محسوبة لحظيًا من نفس البيانات اللي بتدخلها كل يوم — مش
          تقرير منفصل لازم حد يبنيه بعدين.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={<RevenueIcon />} label="الإيرادات"      value="من كل الشغلانات"   color="green" />
          <StatCard icon={<FuelIcon />}    label="تكلفة الوقود"   value="لكل شغلانة"        color="amber" />
          <StatCard icon={<ProfitIcon />}  label="صافي الربح"     value="إيراد ناقص تكلفة"  color="blue" />
          <StatCard icon={<WrenchIcon />}  label="تكلفة الصيانة"  value="لكل معدة"          color="orange" />
          <StatCard icon={<DriverIcon />}  label="المرتبات"       value="من ليدجر السواقين" color="purple" />
          <StatCard icon={<ReceiptIcon />} label="الضرائب والخصومات" value="سجل مستقل"      color="red" />
        </div>
      </Card>
    </div>
  </section>
);

export default DashboardSection;
