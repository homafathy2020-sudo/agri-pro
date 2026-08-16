// src/features/equipment/EquipmentForm.jsx
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Input, Select, NumberInput } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  EQUIPMENT_CATEGORY, EQUIPMENT_CATEGORY_LABELS,
  BASE_EQUIPMENT_TYPES, ATTACHMENT_TYPES,
  EQUIPMENT_STATUS_LABELS,
} from "../../config/constants";

const EquipmentForm = ({ initial, drivers, baseEquipment = [], onSave, onClose }) => {
  const initialCategory = initial?.category || EQUIPMENT_CATEGORY.BASE;
  const typeListInitial = initialCategory === EQUIPMENT_CATEGORY.ATTACHMENT ? ATTACHMENT_TYPES : BASE_EQUIPMENT_TYPES;
  const isOtherInitially = initial ? !typeListInitial.includes(initial?.type) : false;
  const [showCustomType, setShowCustomType] = useState(isOtherInitially);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial ? { category: EQUIPMENT_CATEGORY.BASE, ...initial } : {
      category:            EQUIPMENT_CATEGORY.BASE,
      name:                "",
      type:                "جرار",
      customType:          "",
      fuelRate:            "",
      driverId:            "",
      parentEquipmentId:   "",
      lastOilChangeMeter:  "",
      lastGreaseDate:      "",
      status:              "active",
    },
  });

  const category = useWatch({ control, name: "category" }) || EQUIPMENT_CATEGORY.BASE;
  const isAttachment = category === EQUIPMENT_CATEGORY.ATTACHMENT;
  const currentTypeList = isAttachment ? ATTACHMENT_TYPES : BASE_EQUIPMENT_TYPES;

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    const list = val === EQUIPMENT_CATEGORY.ATTACHMENT ? ATTACHMENT_TYPES : BASE_EQUIPMENT_TYPES;
    setValue("type", list[0]);
    setShowCustomType(false);
    setValue("customType", "");
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setShowCustomType(val === "أخرى");
    if (val !== "أخرى") setValue("customType", "");
  };

  const onSubmit = async (data) => {
    const finalType = data.type === "أخرى" && data.customType?.trim()
      ? data.customType.trim()
      : data.type;

    const payload = {
      category: data.category,
      name:     data.name,
      type:     finalType,
      driverId: data.driverId,
      status:   data.status,
    };

    if (data.category === EQUIPMENT_CATEGORY.ATTACHMENT) {
      payload.parentEquipmentId  = data.parentEquipmentId || "";
      payload.lastGreaseDate     = data.lastGreaseDate || "";
      payload.fuelRate           = 0;
      payload.lastOilChangeMeter = "";
    } else {
      payload.fuelRate           = Number(data.fuelRate) || 0;
      payload.lastOilChangeMeter = data.lastOilChangeMeter === "" ? "" : Number(data.lastOilChangeMeter) || 0;
      payload.parentEquipmentId  = "";
      payload.lastGreaseDate     = "";
    }

    await onSave(payload);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Category — the base/attachment distinction */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-400 tracking-wide mb-1.5 block">نوع التصنيف *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: EQUIPMENT_CATEGORY.BASE,       accent: "green"  },
              { value: EQUIPMENT_CATEGORY.ATTACHMENT, accent: "orange" },
            ].map((opt) => {
              const selected = category === opt.value;
              const activeClasses = opt.accent === "green"
                ? "bg-green-900/30 border-green-600 text-green-300"
                : "bg-orange-900/30 border-orange-600 text-orange-300";
              return (
                <label key={opt.value} className={`cursor-pointer text-center text-sm font-bold rounded-xl border px-3 py-3 transition-colors ${
                  selected ? activeClasses : "bg-surface-2 border-white/10 text-gray-400 hover:text-gray-200"
                }`}>
                  <input
                    type="radio"
                    value={opt.value}
                    className="hidden"
                    {...register("category")}
                    onChange={(e) => { register("category").onChange(e); handleCategoryChange(e); }}
                  />
                  {EQUIPMENT_CATEGORY_LABELS[opt.value]}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {isAttachment
              ? "الملحق بيتعلق على معدة أساسية (جرار/عربية) وممكن يتنقل بينهم"
              : "المعدة الأساسية بتتحرك بذاتها وليها سائق مسؤول عنها"}
          </p>
        </div>

        <div className="sm:col-span-2">
          <Input
            label="اسم المعدة *"
            placeholder={isAttachment ? "مثال: محراث قلاب 5 سلاح" : "مثال: جرار ماسي فيرجسون 290"}
            error={errors.name?.message}
            {...register("name", { required: "اسم المعدة مطلوب" })}
          />
        </div>

        <Select
          label="النوع *"
          {...register("type")}
          onChange={(e) => { register("type").onChange(e); handleTypeChange(e); }}
        >
          {currentTypeList.map((t) => <option key={t}>{t}</option>)}
        </Select>

        {showCustomType ? (
          <Input
            label="اكتب النوع *"
            placeholder="مثال: رشاشة، مقطورة..."
            error={errors.customType?.message}
            {...register("customType", {
              validate: (val) =>
                !showCustomType || (val && val.trim().length > 0)
                  ? true
                  : "اكتب النوع",
            })}
          />
        ) : (
          <div /> // keeps grid balanced
        )}

        {/* Attachment-only: which base equipment it's mounted on */}
        {isAttachment && (
          <Select
            label="متعلقة على معدة *"
            error={errors.parentEquipmentId?.message}
            {...register("parentEquipmentId", { required: isAttachment ? "اختر المعدة المتعلق عليها الملحق" : false })}
          >
            <option value="">— اختر معدة أساسية —</option>
            {baseEquipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </Select>
        )}

        <Select label="السائق المسؤول" {...register("driverId")}>
          <option value="">— اختر سائقاً —</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>

        {/* Base-only: fuel rate + last oil change meter */}
        {!isAttachment && (
          <>
            <Controller
              name="fuelRate"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="معدل استهلاك الوقود (لتر/ساعة)"
                  placeholder="0"
                  {...field}
                />
              )}
            />

            <Controller
              name="lastOilChangeMeter"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="عداد آخر غيار زيت"
                  placeholder="0"
                  {...field}
                />
              )}
            />
          </>
        )}

        {/* Attachment-only: last grease date */}
        {isAttachment && (
          <Input label="تاريخ آخر تشحيم" type="date" {...register("lastGreaseDate")} />
        )}

        <Select label="الحالة" {...register("status")}>
          {Object.entries(EQUIPMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>

      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/8">
        <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button type="submit" loading={isSubmitting}>حفظ</Button>
      </div>
    </form>
  );
};

export default EquipmentForm;
