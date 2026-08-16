// src/features/equipment/EquipmentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  EditIcon, TrashIcon, PlusIcon, EQUIP_TYPE_ICON_MAP, TractorIcon,
  DriverIcon, LinkIcon, OilCanIcon, CalendarIcon,
} from "../../components/ui/Icons";
import { formatCurrency, formatNumber, formatDateShort } from "../../utils/formatters";
import { getLastOilChange, getLastGreaseDate } from "../../utils/serviceHistory";
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_CATEGORY } from "../../config/constants";

const STATUS_VARIANT = { active: "green", maintenance: "amber", inactive: "gray" };

const EquipmentCard = ({ equipment, driver, parent, onEdit, onDelete, onQuickJob }) => {
  const navigate = useNavigate();
  const {
    id, name, type, status = "active", category = EQUIPMENT_CATEGORY.BASE,
    totalRevenue = 0, totalAcres = 0, ops = 0,
    customDriverName, customParentName,
  } = equipment;

  const driverLabel = driver?.name || customDriverName || null;
  const parentLabel = parent?.name || customParentName || null;

  const isAttachment = category === EQUIPMENT_CATEGORY.ATTACHMENT;
  const lastOilChange = !isAttachment ? getLastOilChange(equipment) : null;
  const lastGreaseDate = isAttachment ? getLastGreaseDate(equipment) : null;
  const EquipIcon = EQUIP_TYPE_ICON_MAP[type] ?? TractorIcon;

  const accent = isAttachment
    ? {
        iconBg: "bg-orange-500/10", iconColor: "text-orange-400",
        border: "border-orange-500/20", topBar: "bg-orange-500",
        catBadge: "amber",
      }
    : {
        iconBg: "bg-green-500/10", iconColor: "text-green-400",
        border: "border-green-500/20", topBar: "bg-green-500",
        catBadge: "green",
      };

  return (
    <Card hover className={`relative overflow-hidden border ${accent.border}`}>
      {/* Top category-color bar */}
      <div className={`absolute top-0 inset-x-0 h-0.5 ${accent.topBar}`} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl border border-white/10 flex items-center justify-center flex-shrink-0 ${accent.iconBg}`}>
            <EquipIcon size={22} className={accent.iconColor}/>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-gray-100 truncate">{name}</h3>
              <Badge variant={STATUS_VARIANT[status]}>
                {EQUIPMENT_STATUS_LABELS[status]}
              </Badge>
              <Badge variant={accent.catBadge}>
                {isAttachment ? "ملحق" : "أساسية"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{type}</p>

            {/* Relationship / driver / service info */}
            <div className="flex flex-col gap-1 mt-2">
              {isAttachment && (
                <div className="flex items-center gap-1.5 text-xs text-orange-300/90">
                  <LinkIcon size={12}/>
                  <span>متعلقة على: {parentLabel || "—"}</span>
                </div>
              )}
              {driverLabel && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <DriverIcon size={12}/>
                  <span>السائق: {driverLabel}</span>
                </div>
              )}
              {!isAttachment && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <OilCanIcon size={12}/>
                  <span>آخر غيار زيت: {lastOilChange ? formatNumber(lastOilChange.meter) : "—"}</span>
                </div>
              )}
              {isAttachment && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarIcon size={12}/>
                  <span>آخر تشحيم: {lastGreaseDate ? formatDateShort(lastGreaseDate) : "—"}</span>
                </div>
              )}
            </div>

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
