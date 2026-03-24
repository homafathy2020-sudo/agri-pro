// src/features/equipment/EquipmentForm.jsx
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input, Select, NumberInput } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS_LABELS } from "../../config/constants";

const EquipmentForm = ({ initial, drivers, onSave, onClose }) => {
  const isOtherInitially = initial?.type === "أخرى";
  const [showCustomType, setShowCustomType] = useState(isOtherInitially);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial ?? {
      name:       "",
      type:       "جرار",
      customType: "",
      fuelRate:   "",
      driverId:   "",
      status:     "active",
    },
  });

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setShowCustomType(val === "أخرى");
    if (val !== "أخرى") setValue("customType", "");
  };

  const onSubmit = async (data) => {
    const finalType = data.type === "أخرى" && data.customType?.trim()
      ? data.customType.trim()
      : data.type;

    await onSave({
      name:     data.name,
      type:     finalType,
      fuelRate: Number(data.fuelRate) || 0,
      driverId: data.driverId,
      status:   data.status,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="sm:col-span-2">
          <Input
            label="اسم المعدة *"
            placeholder="مثال: جرار ماسي فيرجسون 290"
            error={errors.name?.message}
            {...register("name", { required: "اسم المعدة مطلوب" })}
          />
        </div>

        <Select
          label="نوع المعدة *"
          {...register("type")}
          onChange={(e) => { register("type").onChange(e); handleTypeChange(e); }}
        >
          {EQUIPMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>

        {showCustomType ? (
          <Input
            label="اكتب نوع المعدة *"
            placeholder="مثال: رشاشة، مقطورة..."
            error={errors.customType?.message}
            {...register("customType", {
              validate: (val) =>
                !showCustomType || (val && val.trim().length > 0)
                  ? true
                  : "اكتب نوع المعدة",
            })}
          />
        ) : (
          <div /> // keeps grid balanced
        )}

        {/* Fuel rate — always visible */}
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

        <Select label="السائق المسؤول" {...register("driverId")}>
          <option value="">— اختر سائقاً —</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>

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
