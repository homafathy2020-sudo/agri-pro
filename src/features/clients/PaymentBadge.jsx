// src/features/clients/PaymentBadge.jsx
import React from "react";
import { Badge } from "../../components/ui/Card";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VARIANTS } from "../../config/constants";

/**
 * Shows "مدفوع / جزئي / غير مدفوع" with appropriate color.
 * Pure display — no business logic.
 */
const PaymentBadge = ({ status }) => {
  const label   = PAYMENT_STATUS_LABELS[status]   ?? status;
  const variant = PAYMENT_STATUS_VARIANTS[status] ?? "gray";
  return <Badge variant={variant}>{label}</Badge>;
};

export default PaymentBadge;
