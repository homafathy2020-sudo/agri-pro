// src/features/profile/PasswordField.jsx
//
// حقل كلمة مرور بزرار إظهار/إخفاء — منقول هنا حرفيًا من ProfileModal.jsx
// من غير أي تغيير في السلوك أو الشكل. مستخدم في PasswordSection.jsx.
import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "../../components/ui/Icons";

const PasswordField = ({ label, error, register }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-400 tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          className={`w-full bg-surface-3 border rounded-xl px-4 py-3 pl-11 text-gray-100 placeholder-gray-500 text-sm
            transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600/50 focus:border-brand-600
            ${error ? "border-red-500 focus:ring-red-500/50" : "border-white/10"}`}
          {...register}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default PasswordField;
