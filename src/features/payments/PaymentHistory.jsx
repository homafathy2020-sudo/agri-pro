// src/features/payments/PaymentHistory.jsx
import React from "react";
import { formatCurrency, formatDateShort } from "../../utils/formatters";
import { TrashIcon, CalendarIcon } from "../../components/ui/Icons";
import Button from "../../components/ui/Button";

/**
 * Shows the list of payment instalments for a single job.
 * Used inside JobCard expanded view or ClientDetailPage.
 */
const PaymentHistory = ({ payments, onDelete }) => {
  if (!payments?.length) {
    return (
      <p className="text-xs text-gray-500 py-2 text-center">لا توجد دفعات مسجلة</p>
    );
  }

  return (
    <div className="divide-y divide-white/8">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarIcon size={11} />
              <span>{formatDateShort(p.date)}</span>
              {p.notes && <span className="text-gray-600">· {p.notes}</span>}
            </div>
          </div>
          <span className="text-sm font-bold text-green-400 tabular-nums flex-shrink-0">
            {formatCurrency(p.amount)}
          </span>
          {onDelete && (
            <Button
              variant="ghost" size="xs"
              icon={<TrashIcon size={12} />}
              className="px-1.5 flex-shrink-0"
              onClick={() => onDelete(p.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;
