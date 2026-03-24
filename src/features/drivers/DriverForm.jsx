// src/features/drivers/DriverForm.jsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Input, NumberInput } from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const DriverForm = ({ initial, onSave, onClose }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial ?? { name: "", phone: "", salary: "" },
  });

  const onSubmit = async (data) => {
    await onSave({ ...data, salary: Number(data.salary) || 0 });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="sm:col-span-2">
          <Input
            label="اسم السائق *"
            placeholder="الاسم الكامل"
            error={errors.name?.message}
            {...register("name", { required: "اسم السائق مطلوب" })}
          />
        </div>

        <Input
          label="رقم الهاتف"
          placeholder="01xxxxxxxxx"
          style={{ direction: "ltr", textAlign: "right" }}
          {...register("phone")}
        />

        <Controller
          name="salary"
          control={control}
          render={({ field }) => (
            <NumberInput
              label="الراتب الشهري (ج.م)"
              placeholder="0"
              {...field}
            />
          )}
        />

      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/8">
        <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button type="submit" loading={isSubmitting}>حفظ</Button>
      </div>
    </form>
  );
};

export default DriverForm;
