// src/components/ui/ChartCard.jsx
//
// كارت مخصص للرسوم البيانية (الداشبوردات) فيه زرار تكبير صغير جنب العنوان.
// بالضغط عليه، نفس الرسم البياني بيتفتح بحجم الصفحة كاملة.
// ملحوظة: ده للرسوم البيانية بس — مش بيتحط على مربعات الأرقام/الفلوس (StatCard).
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { Card, CardHeader, CardBody } from "./Card";
import { ExpandIcon, CloseIcon } from "./Icons";

export const ChartCard = ({
  title,
  subtitle,
  className,
  bodyClassName,
  height = 200,          // ارتفاع الرسم جوه الكارت العادي
  expandedHeight = 420,   // ارتفاع الرسم لما يكون مكبّر
  footer,                 // عنصر ثابت (زي الـ Legend) بيتكرر تحت الرسم في الحالتين
  children,               // دالة: (height) => JSX الرسم البياني
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const expandBtn = (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      title="تكبير"
      aria-label="تكبير الرسم البياني"
      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-brand-900/40 text-gray-400 hover:text-brand-400 transition-colors flex-shrink-0"
    >
      <ExpandIcon size={14} />
    </button>
  );

  return (
    <>
      <Card className={className}>
        <CardHeader title={title} subtitle={subtitle} actions={expandBtn} />
        <CardBody className={bodyClassName}>
          {children(height)}
          {footer}
        </CardBody>
      </Card>

      {expanded && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setExpanded(false)}
        >
          <div
            dir="rtl"
            className="w-full h-full max-w-6xl bg-surface border border-white/10 rounded-2xl flex flex-col overflow-hidden animate-slide-up"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-100">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-red-900/60 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className={clsx("flex-1 overflow-auto p-6", bodyClassName)}>
              {children(expandedHeight)}
              {footer}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartCard;
