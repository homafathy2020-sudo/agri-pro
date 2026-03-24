// src/features/jobs/JobFilters.jsx
import React from "react";
import { Select } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { WORK_TYPES, PAYMENT_STATUS_LABELS } from "../../config/constants";

const JobFilters = ({ filters, setFilters, clearFilters, hasActiveFilters, equipment, drivers }) => {
  const set = (key) => (e) => setFilters((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="min-w-[140px] flex-1">
        <Select value={filters.equipmentId} onChange={set("equipmentId")}>
          <option value="">كل المعدات</option>
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>

      <div className="min-w-[120px] flex-1">
        <Select value={filters.workType} onChange={set("workType")}>
          <option value="">كل الأعمال</option>
          {WORK_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>

      <div className="min-w-[140px] flex-1">
        <Select value={filters.driverId} onChange={set("driverId")}>
          <option value="">كل السائقين</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>

      {/* NEW: Payment status filter */}
      <div className="min-w-[130px] flex-1">
        <Select value={filters.paymentStatus} onChange={set("paymentStatus")}>
          <option value="">كل الحالات</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="min-w-[130px] flex-1">
        <input type="date" value={filters.dateFrom} onChange={set("dateFrom")}
          className="w-full bg-surface-2 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-600" />
      </div>

      <div className="min-w-[130px] flex-1">
        <input type="date" value={filters.dateTo} onChange={set("dateTo")}
          className="w-full bg-surface-2 border border-white/10 rounded-xl px-3 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-600" />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="md" onClick={clearFilters}>مسح</Button>
      )}
    </div>
  );
};

export default JobFilters;
