// src/features/landing/FinalCtaSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";

const FinalCtaSection = () => (
  <section className="py-16 sm:py-20 border-t border-white/8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-brand-800/40 bg-gradient-to-l from-brand-900/25 to-transparent px-6 py-12 sm:px-14 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-50 max-w-xl mx-auto leading-snug">
          خلي بيانات شغلك في مكان واحد، وشوف الصورة أوضح.
        </h2>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth?mode=register">
            <Button size="lg">ابدأ الآن</Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCtaSection;
