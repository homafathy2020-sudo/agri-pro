// src/features/salary/SalaryEntryForm.jsx
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input, Select, NumberInput } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  SALARY_ENTRY_TYPES, SALARY_ENTRY_LABELS,
  DEDUCTION_REASONS, BONUS_REASONS,
} from "../../config/constants";
import { todayISO } from "../../utils/formatters";

const TYPE_OPTIONS = Object.entries(SALARY_ENTRY_LABELS).map(([value, label]) => ({ value, label }));

const SalaryEntryForm = ({ driverId, driverName, onSave, onClose }) => {
  const {
    register, handleSubmit, control, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type:   SALARY_ENTRY_TYPES.BASE,
      amount: "",
      reason: "",
      date:   todayISO(),
      notes:  "",
      paid:   true,
    },
  });

  const type = watch("type");

  const reasonOptions =
    type === SALARY_ENTRY_TYPES.DEDUCTION ? DEDUCTION_REASONS :
    type === SALARY_ENTRY_TYPES.BONUS     ? BONUS_REASONS     : [];

  const onSubmit = async (data) => {
    await onSave({
      ...data,
      driverId,
      amount: Number(data.amount) || 0,
      paid:   data.type === SALARY_ENTRY_TYPES.BASE || data.type === SALARY_ENTRY_TYPES.BONUS
                ? !!data.paid : true,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="mb-4 px-3 py-2 bg-brand-900/20 border border-brand-800/40 rounded-xl">
        <p className="text-xs text-brand-400 font-semibold">السائق: {driverName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <Select label="نوع القيد" {...register("type")}>
          {TYPE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        <Controller
          name="amount"
          control={control}
          rules={{ required: "أدخل المبلغ" }}
          render={({ field }) => (
            <NumberInput
              label="المبلغ (ج.م) *"
              placeholder="0"
              error={errors.amount?.message}
              {...field}
            />
          )}
        />

        {reasonOptions.length > 0 && (
          <Select label="السبب" {...register("reason")}>
            <option value="">— اختر السبب —</option>
            {reasonOptions.map((r) => <option key={r}>{r}</option>)}
          </Select>
        )}

        <Input label="التاريخ" type="date" {...register("date")} />

        {(type === SALARY_ENTRY_TYPES.BASE || type === SALARY_ENTRY_TYPES.BONUS) && (
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="paid-check"
              className="w-4 h-4 accent-brand-600"
              {...register("paid")}
            />
            <label htmlFor="paid-check" className="text-sm text-gray-300 cursor-pointer">
              تم الصرف فعلاً
            </label>
          </div>
        )}

        <div className="sm:col-span-2">
          <Input label="ملاحظات" placeholder="تفاصيل إضافية..." {...register("notes")} />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/8">
        <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button type="submit" loading={isSubmitting}>تسجيل</Button>
      </div>
    </form>
  );
};

export default SalaryEntryForm;
