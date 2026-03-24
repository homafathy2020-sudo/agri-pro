// src/features/drivers/DriverCard.jsx
import React from "react";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { EditIcon, TrashIcon, PhoneIcon } from "../../components/ui/Icons";
import { formatCurrency, formatNumber, getInitial } from "../../utils/formatters";

const StatItem = ({ label, value, color = "text-gray-200" }) => (
  <div className="flex flex-col gap-0.5">
    <span className={`text-sm font-extrabold ${color}`}>{value}</span>
    <span className="text-[10px] text-gray-500">{label}</span>
  </div>
);

const DriverCard = ({ driver, onEdit, onDelete }) => {
  const { name, phone, salary, totalRevenue = 0, totalAcres = 0, ops = 0 } = driver;

  return (
    <Card hover>
      <div className="p-5">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-700 to-blue-700 flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0 shadow-lg">
            {getInitial(name)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-gray-100 truncate">{name}</h3>
            {phone && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <PhoneIcon size={11} className="text-gray-500" />
                <p className="text-xs text-gray-500" style={{ direction: "ltr" }}>{phone}</p>
              </div>
            )}
            <div className="flex gap-4 mt-3 flex-wrap">
              <StatItem label="أفدنة"   value={formatNumber(totalAcres)}    color="text-blue-400" />
              <StatItem label="إيراد"   value={formatCurrency(totalRevenue)} color="text-amber-400" />
              <StatItem label="عمليات"  value={ops} />
              {salary > 0 && (
                <StatItem label="الراتب" value={formatCurrency(salary)} color="text-green-400" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button variant="secondary" size="xs" onClick={onEdit}   icon={<EditIcon size={13} />}  className="px-3" />
            <Button variant="ghost"     size="xs" onClick={onDelete} icon={<TrashIcon size={13} />} className="px-3" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DriverCard;
