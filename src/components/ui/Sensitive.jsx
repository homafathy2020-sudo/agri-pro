// src/components/ui/Sensitive.jsx
import React from "react";
import clsx from "clsx";
import { usePrivacy } from "../../contexts/PrivacyContext";
import { EyeOffIcon } from "./Icons";

// Wraps a block (chart, card body, etc.) and blurs it while privacy mode is on.
// `as` lets it render as span/div/etc. `hint` shows a small centered "hidden"
// badge over the blurred block — useful for larger blocks like charts.
const Sensitive = ({ children, className, as: As = "div", hint = false, blur = 10 }) => {
  const { isPrivate } = usePrivacy();

  return (
    <As className={clsx("relative transition-[filter] duration-300", className)}>
      <div
        style={{
          filter: isPrivate ? `blur(${blur}px)` : "none",
          userSelect: isPrivate ? "none" : "auto",
          pointerEvents: isPrivate ? "none" : "auto",
        }}
        className="transition-[filter] duration-300"
        aria-hidden={isPrivate}
      >
        {children}
      </div>

      {isPrivate && hint && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 pointer-events-none">
          <EyeOffIcon size={13} />
          <span>بيانات مخفية</span>
        </div>
      )}
    </As>
  );
};

export default Sensitive;
