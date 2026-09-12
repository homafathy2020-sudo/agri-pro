// src/utils/pdf/supplierInvoice.js
// Supplier Invoice (فاتورة مورّد) — letterhead style, same as the client
// invoice (شعار/بيانات الشركة، شريط مائي، توقيع/اعتماد في الآخر). عمدًا
// مبنية زي invoice.js بالظبط، مش زي تقرير عام (BASE_CSS) — لأنها بتمثل
// عملية تجارية واحدة مع طرف مسمّى (المورد) بمبلغ وتاريخ محددين، تمامًا
// زي فاتورة العميل لعملية واحدة، مش ملخص/تجميع لفترة زمنية.
//
// اتجاه المبلغ هنا معكوس عن فاتورة العميل: هنا الشركة هي المدينة (بتدفع
// للمورد)، مش الدائنة — فالتوقيع الأول بتاع "المستلم" بقى توقيع المورد
// (اللي هيستلم الفلوس)، مش العميل.

import { formatCurrency, formatDate, formatDateTime } from "../formatters";
import { getInvoicePaidAmount, calcSupplierRemaining } from "../calculations";
import { escapeHtml, INVOICE_CSS, printWindow, downloadReportPdf } from "./core";

// رقم فاتورة ثابت لكل عملية (سنة العملية + جزء من معرّفها) — نفس فكرة
// buildInvoiceNumber في invoice.js بالظبط، عشان يبقى نفس أسلوب الترقيم في
// كل فواتير التطبيق.
const buildSupplierInvoiceNumber = (invoice) => {
  const d = new Date(invoice.createdAt?.toDate?.() || invoice.createdAt || invoice.date || Date.now());
  const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const idPart = String(invoice.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
  return `${year}-${idPart}`;
};

const buildSupplierInvoiceHtml = ({ invoice, supplierPayments = [], company = {} }) => {
  // نفس دوال الحساب المستخدمة أصلاً في useSuppliers.js — مفيش حساب موازي
  // هنا، الرقم لازم يطابق 100% اللي ظاهر في صفحة المورد نفسها.
  const totalPaid = getInvoicePaidAmount(invoice, supplierPayments);
  const remaining = calcSupplierRemaining(invoice.amount, totalPaid);
  const printedAt = formatDateTime(new Date());

  // سجل الدفعات الخاص بالفاتورة دي بس (نفس فكرة jobPayments في JobCard.jsx)
  const invoicePayments = supplierPayments
    .filter((p) => p.supplierInvoiceId === invoice.id)
    .sort((a, b) => (a.date || a.createdAt || "").toString().localeCompare((b.date || b.createdAt || "").toString()));

  const companyName = (company.name || "").trim() || "اسم الشركة / المزرعة";
  const logoInitials = companyName.replace(/\s+/g, "").slice(0, 2) || "شر";
  const metaLine2 = [
    company.commercialRegister ? `سجل تجاري: ${escapeHtml(company.commercialRegister)}` : "",
    company.taxNumber ? `الرقم الضريبي: ${escapeHtml(company.taxNumber)}` : "",
  ].filter(Boolean).join(" · ");

  const paymentBadge = remaining <= 0
    ? `<span class="badge badge-green">مدفوعة بالكامل</span>`
    : totalPaid > 0
    ? `<span class="badge badge-amber">مدفوعة جزئياً</span>`
    : `<span class="badge badge-red">غير مدفوعة</span>`;

  const paymentsRows = invoicePayments.map((p) => `
    <tr>
      <td>${formatDateTime(p.createdAt || p.date)}</td>
      <td>${escapeHtml(p.notes) || "—"}</td>
      <td>${formatCurrency(p.amount)}</td>
    </tr>
  `).join("");

  const html = `
    <style>${INVOICE_CSS}</style>
    <div class="page inv-page">
      <div class="inv-watermark">${remaining <= 0 ? "مدفوعة" : "فاتورة"}</div>

      <div class="inv-header">
        <div class="inv-company">
          ${company.logo
            ? `<img class="inv-logo-img" src="${escapeHtml(company.logo)}" alt="شعار الشركة" />`
            : `<div class="inv-logo-box">${escapeHtml(logoInitials)}</div>`}
          <div>
            <div class="inv-company-name">${escapeHtml(companyName)}</div>
            <div class="inv-company-meta">
              ${company.address ? escapeHtml(company.address) : "أضف عنوان الشركة من الملف الشخصي"}
              ${metaLine2 ? `<br>${metaLine2}` : ""}
            </div>
          </div>
        </div>
        <div class="inv-meta">
          <span class="inv-tag">فاتورة مورّد</span>
          <div class="inv-no">رقم ${buildSupplierInvoiceNumber(invoice)}</div>
          <div class="inv-date">صدرت: ${printedAt}</div>
          <div style="margin-top:8px">${paymentBadge}</div>
          <div class="inv-badge-note">
            هذه الفاتورة صادرة إلكترونياً وتُعتمد بتوقيع الطرفين<br>
            رقم الفاتورة ${buildSupplierInvoiceNumber(invoice)} · تم الإصدار ${printedAt}
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-box">
          <div class="stat-lbl">اسم المورد / الشخص</div>
          <div class="stat-val">${escapeHtml(invoice.supplierName) || "—"}</div>
        </div>
        <div class="stat-box">
          <div class="stat-lbl">تاريخ الفاتورة</div>
          <div class="stat-val">${formatDate(invoice.date)}</div>
        </div>
      </div>

      <div class="section">
        <h2>بيانات الفاتورة</h2>
        <table>
          <tr><td style="font-weight:600; width:45%">الشغل / المُورَّد</td><td>${escapeHtml(invoice.description) || "—"}</td></tr>
          ${invoice.notes ? `<tr><td style="font-weight:600">ملاحظات</td><td>${escapeHtml(invoice.notes)}</td></tr>` : ""}
        </table>
      </div>

      <div class="section">
        <h2>الملخص المالي</h2>
        <table>
          <tr><td style="font-weight:600; width:45%">إجمالي المبلغ المستحق</td><td style="color:#991b1b;font-weight:800">${formatCurrency(invoice.amount)}</td></tr>
          <tr><td style="font-weight:600">المبلغ المدفوع</td><td style="color:#15803d">${formatCurrency(totalPaid)}</td></tr>
          <tr class="total-row"><td>المبلغ المتبقي</td><td style="color:${remaining>0?"#991b1b":"#15803d"}">${formatCurrency(remaining)}</td></tr>
        </table>
      </div>

      ${paymentsRows ? `
      <div class="section">
        <h2>سجل الدفعات (${invoicePayments.length})</h2>
        <table>
          <thead><tr><th>التاريخ والوقت</th><th>ملاحظات</th><th>المبلغ</th></tr></thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      </div>` : ""}

      <div class="inv-closing">
        <div class="inv-sign-section">
          <div class="inv-sign-box">
            <div class="inv-sign-line"></div>
            <div class="inv-sign-label">توقيع المورد</div>
            <div class="inv-sign-sub">${escapeHtml(invoice.supplierName) || ""}</div>
          </div>
          <div class="inv-sign-box">
            <div class="inv-sign-line">
              <div class="inv-stamp-hint">مكان<br>الختم</div>
            </div>
            <div class="inv-sign-label">توقيع واعتماد الشركة</div>
            <div class="inv-sign-sub">${escapeHtml(companyName)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    title: `فاتورة مورد - ${invoice.supplierName || ""}`,
    filename: `فاتورة-مورد-${(invoice.supplierName || "").replace(/[<>:"/\\|?*]/g, "")}`,
  };
};

export const printSupplierInvoice = (args) => {
  const { html, title } = buildSupplierInvoiceHtml(args);
  printWindow(html, title);
};

export const downloadSupplierInvoicePdf = (args) => {
  const { html, filename } = buildSupplierInvoiceHtml(args);
  return downloadReportPdf(html, filename);
};
