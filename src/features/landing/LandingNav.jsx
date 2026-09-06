// src/features/landing/LandingNav.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon, CloseIcon } from "../../components/ui/Icons";
import Button from "../../components/ui/Button";

const LINKS = [
  { href: "#problem",       label: "المشكلة" },
  { href: "#how-it-works",  label: "إزاي بيشتغل" },
  { href: "#features",      label: "المميزات" },
  { href: "#story",         label: "قصتنا" },
];

const LandingNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark/85 backdrop-blur-md border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <img src="/brand-icon.png" alt="زراعي برو" className="w-9 h-9 rounded-xl" />
          <span className="text-base font-extrabold text-gray-100">زراعي برو</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-sm font-semibold text-gray-400 hover:text-gray-100 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/auth" className="text-sm font-semibold text-gray-400 hover:text-gray-100 transition-colors px-2">
            تسجيل الدخول
          </Link>
          <Link to="/auth?mode=register">
            <Button size="sm">ابدأ الآن</Button>
          </Link>
        </div>

        <button
          className="lg:hidden text-gray-300 p-2 -mr-2"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        >
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/8 bg-dark px-4 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-sm font-semibold text-gray-300 py-2.5">
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-3 mt-2 pt-3 border-t border-white/8">
            <Link to="/auth" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="secondary" size="md" className="w-full">تسجيل الدخول</Button>
            </Link>
            <Link to="/auth?mode=register" onClick={() => setOpen(false)} className="flex-1">
              <Button size="md" className="w-full">ابدأ الآن</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
