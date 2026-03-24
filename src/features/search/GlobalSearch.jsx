// src/features/search/GlobalSearch.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const RESULT_TYPES = {
  equipment: { label: "معدة",  color: "text-brand-400", bg: "bg-brand-900/30" },
  driver:    { label: "سائق",  color: "text-blue-400",  bg: "bg-blue-900/30"  },
  client:    { label: "عميل",  color: "text-amber-400", bg: "bg-amber-900/30" },
  job:       { label: "عملية", color: "text-green-400", bg: "bg-green-900/30" },
};

const GlobalSearch = () => {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const ref      = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { equipment, drivers, jobs } = useData();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const list = [];

    equipment.forEach((eq) => {
      if (eq.name?.toLowerCase().includes(q) || eq.type?.toLowerCase().includes(q))
        list.push({ type:"equipment", id:eq.id, label:eq.name, sub:eq.type, path:`/equipment/${eq.id}` });
    });

    drivers.forEach((drv) => {
      if (drv.name?.toLowerCase().includes(q) || drv.phone?.includes(q))
        list.push({ type:"driver", id:drv.id, label:drv.name, sub:drv.phone||"سائق", path:`/drivers/${drv.id}` });
    });

    const uniqueClients = [...new Set(jobs.map(j => j.client).filter(Boolean))];
    uniqueClients.forEach((client) => {
      if (client.toLowerCase().includes(q))
        list.push({ type:"client", id:client, label:client, sub:"اضغط لعرض تفاصيل العميل", path:`/clients/${encodeURIComponent(client)}` });
    });

    jobs.filter(j =>
      j.client?.toLowerCase().includes(q) ||
      j.workType?.toLowerCase().includes(q)
    ).slice(0,3).forEach((job) => {
      list.push({ type:"job", id:job.id, label:`${job.client} — ${job.workType}`, sub:job.date, path:"/jobs" });
    });

    return list.slice(0, 8);
  }, [query, equipment, drivers, jobs]);

  const handleSelect = (r) => { navigate(r.path); setQuery(""); setOpen(false); };

  return (
    <div className="relative flex-1 max-w-xs" ref={ref}>
      <div className={`flex items-center gap-2 bg-surface-2 border rounded-xl px-3 py-2 transition-all ${
        focused ? "border-brand-600/60 ring-1 ring-brand-600/20" : "border-white/10"
      }`}>
        <span className="text-gray-500 flex-shrink-0"><SearchIcon/></span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder="بحث سريع... (Ctrl+K)"
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none min-w-0"
          style={{ direction:"rtl" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-11 right-0 left-0 z-50 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">لا توجد نتائج لـ "{query}"</div>
          ) : (
            <div className="py-1">
              {results.map((r, i) => {
                const t = RESULT_TYPES[r.type];
                return (
                  <button key={i} onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${t.color} ${t.bg}`}>{t.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-100 truncate">{r.label}</p>
                      {r.sub && <p className="text-xs text-gray-500 truncate">{r.sub}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
