// src/features/equipment/EquipmentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { EditIcon, TrashIcon, PlusIcon, EQUIP_TYPE_ICON_MAP, TractorIcon } from "../../components/ui/Icons";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { EQUIPMENT_STATUS_LABELS } from "../../config/constants";

const STATUS_VARIANT = { active: "green", maintenance: "amber", inactive: "gray" };

const EquipmentCard = ({ equipment, onEdit, onDelete, onQuickJob }) => {
  const navigate = useNavigate();
  const {
    id, name, type, status = "active",
    totalRevenue = 0, totalAcres = 0, ops = 0,
  } = equipment;

  const EquipIcon = EQUIP_TYPE_ICON_MAP[type] ?? TractorIcon;

  return (
    <Card hover>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-11 h-11 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center flex-shrink-0">
            <EquipIcon size={22} className="text-brand-400"/>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-gray-100 truncate">{name}</h3>
              <Badge variant={STATUS_VARIANT[status]}>
                {EQUIPMENT_STATUS_LABELS[status]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{type}</p>

            {/* Stats */}
            <div className="flex gap-4 mt-3 flex-wrap">
              {[
                { label:"أفدنة",  value:formatNumber(totalAcres),     color:"text-blue-400"  },
                { label:"إيراد",  value:formatCurrency(totalRevenue),  color:"text-amber-400" },
                { label:"عمليات", value:ops,                           color:"text-gray-300"  },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex gap-1.5">
              <Button variant="ghost" size="xs" icon={<EditIcon size={13}/>}  onClick={onEdit}   className="px-2"/>
              <Button variant="ghost" size="xs" icon={<TrashIcon size={13}/>} onClick={onDelete} className="px-2"/>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate(`/equipment/${id}`)}>
              تفاصيل
            </Button>
          </div>
        </div>

        {/* Quick Job button */}
        <div className="mt-4 pt-3 border-t border-white/8">
          <button
            onClick={onQuickJob}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900/30 border border-brand-800/40 text-brand-400 text-xs font-bold hover:bg-brand-900/50 transition-colors"
          >
            <PlusIcon size={14}/>
            تسجيل شغل جديد لهذه المعدة
          </button>
        </div>
      </div>
    </Card>
  );
};

export default EquipmentCard;
