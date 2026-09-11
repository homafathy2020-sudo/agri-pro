// src/features/profile/PasswordSection.jsx
//
// نموذج تغيير كلمة المرور — منقول هنا حرفيًا من ProfileModal.jsx من غير
// أي تغيير في السلوك أو الشكل.
import React from "react";
import toast from "react-hot-toast";
import {
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import { auth } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { LockIcon } from "../../components/ui/Icons";
import Section from "./Section";
import PasswordField from "./PasswordField";

const PasswordSection = () => {
  const { user } = useAuth();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const onChangePassword = async (form) => {
    try {
      const cred = EmailAuthProvider.credential(user.email, form.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, form.newPassword);
      toast.success("تم تغيير كلمة المرور بنجاح");
      reset();
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("كلمة المرور الحالية غير صحيحة");
      } else if (err.code === "auth/weak-password") {
        toast.error("كلمة المرور الجديدة ضعيفة جدًا");
      } else {
        toast.error("تعذر تغيير كلمة المرور");
      }
    }
  };

  return (
    <Section icon={<LockIcon size={16} />} title="تغيير كلمة المرور">
      <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3" noValidate>
        <PasswordField
          label="كلمة المرور الحالية"
          error={errors.currentPassword?.message}
          register={register("currentPassword", { required: "مطلوب" })}
        />
        <PasswordField
          label="كلمة المرور الجديدة"
          error={errors.newPassword?.message}
          register={register("newPassword", {
            required: "مطلوب",
            minLength: { value: 6, message: "6 أحرف على الأقل" },
          })}
        />
        <PasswordField
          label="تأكيد كلمة المرور الجديدة"
          error={errors.confirmPassword?.message}
          register={register("confirmPassword", {
            required: "مطلوب",
            validate: (val) => val === watch("newPassword") || "كلمتا المرور غير متطابقتين",
          })}
        />
        <Button type="submit" size="sm" loading={isSubmitting} className="w-full">
          حفظ كلمة المرور الجديدة
        </Button>
      </form>
    </Section>
  );
};

export default PasswordSection;
