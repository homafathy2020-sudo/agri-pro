// src/components/ui/PrivacyToggle.jsx
import React from "react";
import { usePrivacy } from "../../contexts/PrivacyContext";
import { EyeIcon, EyeOffIcon } from "./Icons";

const PrivacyToggle = ({ label = "البيانات المالية" }) => {
  const { isPrivate, toggle } = usePrivacy();

  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-xs font-semibold text-gray-500">
        {isPrivate ? `${label} مخفية` : `${label} ظاهرة`}
      </span>

      <button
        onClick={toggle}
        title={isPrivate ? "إظهار البيانات" : "إخفاء البيانات"}
        aria-pressed={!isPrivate}
        className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-white/10 text-gray-400 hover:text-brand-400 hover:border-brand-500/30 active:scale-95 transition-all duration-200"
      >
        <span className="relative flex items-center justify-center">
          <EyeOffIcon
            size={18}
            className={`absolute transition-all duration-300 ${isPrivate ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          />
          <EyeIcon
            size={18}
            className={`absolute transition-all duration-300 ${isPrivate ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
          />
        </span>
      </button>
    </div>
  );
};

export default PrivacyToggle;
