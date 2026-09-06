// src/features/landing/Hero.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { Badge, StatCard } from "../../components/ui/Card";
import { RevenueIcon, WalletIcon, TractorIcon, ProfitIcon } from "../../components/ui/Icons";

const Hero = () => (
  <section id="top" className="relative overflow-hidden">
    {/* Ambient glow — same treatment as AuthPage, kept subtle */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-900/25 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-blue-900/15 rounded-full blur-3xl" />
    </div>

    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div className="max-w-3xl">
        <Badge variant="green" className="mb-5">نظام إدارة شركات المعدات الزراعية</Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-50 leading-[1.25] sm:leading-[1.2]">
          بيانات أوضح. قرارات أذكى. أرباح أكبر.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl">
          زراعي برو بيجمع شغل شركتك، معداتك، سواقينك، وفلوسك في نظام واحد متصل —
          بدل ما تفضل تدور عليهم في الواتساب والدفاتر وملفات الإكسل المتفرقة.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/auth?mode=register">
            <Button size="lg">ابدأ الآن</Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg">شوف إزاي بيشتغل</Button>
          </a>
        </div>
      </div>

      {/* Product-truth mini preview — real UI language, not a stock photo */}
      <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
        <StatCard icon={<RevenueIcon />} label="إيرادات الشغل" value="متصلة بالعميل" color="green" />
        <StatCard icon={<WalletIcon />}  label="رصيد العهدة" value="محدّث أول بأول" color="amber" />
        <StatCard icon={<TractorIcon />} label="حالة المعدات" value="واضحة قدامك" color="blue" />
        <StatCard icon={<ProfitIcon />} label="مستحقات العملاء" value="بتتحسب لوحدها" color="purple" />
      </div>
    </div>
  </section>
);

export default Hero;
