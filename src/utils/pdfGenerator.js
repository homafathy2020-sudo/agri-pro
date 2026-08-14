// src/utils/pdfGenerator.js
// Uses the browser's built-in print dialog — zero dependencies.
// Creates a styled HTML document, opens it in a new window, triggers print.

import { formatCurrency, formatNumber, formatDate, formatDateTime } from "./formatters";
import { getJobPaidAmount } from "./calculations";

// ── Shared styles ─────────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Cairo', sans-serif;
    direction: rtl;
    color: #1a1a2e;
    background: #fff;
    font-size: 13px;
    line-height: 1.6;
  }
  .page { max-width: 780px; margin: 0 auto; padding: 32px 28px; }
  h1 { font-size: 22px; font-weight: 800; color: #0f4c2a; }
  h2 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:16px; border-bottom:2px solid #0f4c2a; }
  .brand { color:#0f4c2a; font-size:11px; font-weight:600; margin-top:4px; }
  .meta { text-align:left; font-size:11px; color:#666; }
  .section { margin-bottom:24px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .stat-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 14px; }
  .stat-val { font-size:18px; font-weight:800; color:#15803d; }
  .stat-lbl { font-size:10px; color:#666; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { background:#0f4c2a; color:white; padding:8px 10px; font-size:11px; font-weight:700; text-align:right; }
  td { padding:7px 10px; font-size:11px; border-bottom:1px solid #e5e7eb; }
  tr:nth-child(even) td { background:#f9fafb; }
  .total-row td { font-weight:800; background:#f0fdf4; border-top:2px solid #0f4c2a; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; }
  .badge-green { background:#dcfce7; color:#15803d; }
  .badge-amber { background:#fef3c7; color:#92400e; }
  .badge-red   { background:#fee2e2; color:#991b1b; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af; text-align:center; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display:none; }
  }
`;

// ── Open print window ─────────────────────────────────────────────────────────
const printWindow = (htmlContent, title) => {
  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8"/>
      <title>${title}</title>
      <style>${BASE_CSS}</style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = () => {
          setTimeout(() => { window.print(); }, 600);
        };
      </scr` + `ipt>
    </body>
    </html>
  `);
  win.document.close();
};

// ── 1. Client Invoice ─────────────────────────────────────────────────────────
export const printClientInvoice = ({ job, equipmentName, driverName, fuelPrice, payments = [], maintenance = [] }) => {
  const revenue   = (job.acres || 0) * (job.pricePerAcre || 0);
  const fuelCost  = (job.fuelUsed || 0) * fuelPrice;
  const profit    = revenue - fuelCost;
  // مصدر واحد للمدفوع: مجموع سجلات payments، أو job.amountPaid كـ fallback
  // للعمليات القديمة اللي اتسجلت قبل نظام الدفعات — مش الاتنين مع بعض.
  const totalPaid = getJobPaidAmount(job, payments);
  const remaining = Math.max(0, revenue - totalPaid);
  const today     = new Date().toLocaleDateString("ar-EG");
  const maintCost = maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0);

  const paymentBadge = remaining <= 0
    ? `<span class="badge badge-green">مدفوع بالكامل</span>`
    : totalPaid > 0
    ? `<span class="badge badge-amber">مدفوع جزئياً</span>`
    : `<span class="badge badge-red">غير مدفوع</span>`;

  const paymentsRows = payments.map((p) => `
    <tr>
      <td>${formatDateTime(p.createdAt || p.date)}</td>
      <td>${p.notes || "—"}</td>
      <td>${formatCurrency(p.amount)}</td>
    </tr>
  `).join("");

  const maintRows = maintenance.map((m) => `
    <tr>
      <td>${formatDateTime(m.createdAt || m.date)}</td>
      <td>${m.type || "—"}</td>
      <td>${m.notes || "—"}</td>
      <td>${formatCurrency(m.cost)}</td>
    </tr>
  `).join("");

  const html = `
    <div class="page">
      <div class="header">
        <div>
          <h1>فاتورة عمل</h1>
          <p class="brand">زراعي برو · إدارة المعدات الزراعية</p>
        </div>
        <div class="meta">
          <p>تاريخ الطباعة: ${today}</p>
          <p>تاريخ ووقت العملية: ${formatDateTime(job.createdAt || job.date)}</p>
          <p style="margin-top:6px">${paymentBadge}</p>
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-box">
          <div class="stat-val">${job.client || "—"}</div>
          <div class="stat-lbl">اسم العميل / الأرض</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${job.workType || "—"}</div>
          <div class="stat-lbl">نوع العمل</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${formatNumber(job.acres)} فدان</div>
          <div class="stat-lbl">عدد الأفدنة</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${formatCurrency(job.pricePerAcre)}</div>
          <div class="stat-lbl">سعر الفدان</div>
        </div>
      </div>

      ${equipmentName || driverName ? `
      <div class="section">
        <h2>تفاصيل التشغيل</h2>
        <table>
          <tr><td style="font-weight:600">المعدة المستخدمة</td><td>${equipmentName || "—"}</td></tr>
          <tr><td style="font-weight:600">السائق</td><td>${driverName || "—"}</td></tr>
          <tr><td style="font-weight:600">الوقود المستخدم</td><td>${formatNumber(job.fuelUsed)} لتر</td></tr>
          <tr><td style="font-weight:600">تكلفة الوقود</td><td style="color:#991b1b">${formatCurrency(fuelCost)}</td></tr>
          ${maintenance.length ? `<tr><td style="font-weight:600">تكلفة الصيانة (المعدة)</td><td style="color:#991b1b">${formatCurrency(maintCost)}</td></tr>` : ""}
        </table>
      </div>` : ""}

      <div class="section">
        <h2>الملخص المالي</h2>
        <table>
          <tr><td style="font-weight:600">إجمالي الإيراد</td><td style="color:#15803d;font-weight:800">${formatCurrency(revenue)}</td></tr>
          <tr><td style="font-weight:600">المبلغ المدفوع</td><td style="color:#15803d">${formatCurrency(totalPaid)}</td></tr>
          <tr class="total-row"><td>المبلغ المتبقي</td><td style="color:${remaining>0?"#991b1b":"#15803d"}">${formatCurrency(remaining)}</td></tr>
        </table>
      </div>

      ${paymentsRows ? `
      <div class="section">
        <h2>سجل الدفعات (${payments.length})</h2>
        <table>
          <thead><tr><th>التاريخ والوقت</th><th>ملاحظات</th><th>المبلغ</th></tr></thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      </div>` : ""}

      ${maintRows ? `
      <div class="section">
        <h2>سجل صيانة المعدة (${maintenance.length})</h2>
        <table>
          <thead><tr><th>التاريخ والوقت</th><th>نوع الصيانة</th><th>ملاحظات</th><th>التكلفة</th></tr></thead>
          <tbody>${maintRows}</tbody>
          <tr class="total-row"><td colspan="3">إجمالي تكلفة الصيانة</td><td style="color:#991b1b">${formatCurrency(maintCost)}</td></tr>
        </table>
      </div>` : ""}

      <div class="footer">زراعي برو · تم إنشاء هذه الفاتورة تلقائياً · ${today}</div>
    </div>
  `;

  printWindow(html, `فاتورة - ${job.client}`);
};

// ── 2. Equipment Report ───────────────────────────────────────────────────────
export const printEquipmentReport = ({ equipment, jobs, maintenance, fuelPrice, driverName }) => {
  const today      = new Date().toLocaleDateString("ar-EG");
  const totalRevenue  = jobs.reduce((s, j) => s + (j.acres * j.pricePerAcre), 0);
  const totalAcres    = jobs.reduce((s, j) => s + (j.acres || 0), 0);
  const totalFuel     = jobs.reduce((s, j) => s + (j.fuelUsed || 0), 0);
  const totalFuelCost = totalFuel * fuelPrice;
  const maintCost     = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const netProfit     = totalRevenue - totalFuelCost - maintCost;

  const jobRows = jobs.map((j) => `
    <tr>
      <td>${formatDate(j.date)}</td>
      <td>${j.client || "—"}</td>
      <td>${j.workType || "—"}</td>
      <td>${formatNumber(j.acres)}</td>
      <td>${formatCurrency(j.acres * j.pricePerAcre)}</td>
    </tr>
  `).join("");

  const maintRows = maintenance.map((m) => `
    <tr>
      <td>${formatDate(m.date)}</td>
      <td>${m.type}</td>
      <td>${m.notes || "—"}</td>
      <td>${formatCurrency(m.cost)}</td>
    </tr>
  `).join("");

  const html = `
    <div class="page">
      <div class="header">
        <div>
          <h1>تقرير معدة</h1>
          <p class="brand">زراعي برو · ${equipment.name}</p>
        </div>
        <div class="meta">
          <p>تاريخ الطباعة: ${today}</p>
          <p>النوع: ${equipment.type}</p>
          ${driverName ? `<p>السائق: ${driverName}</p>` : ""}
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-box"><div class="stat-val">${formatNumber(totalAcres)} فدان</div><div class="stat-lbl">إجمالي الأفدنة</div></div>
        <div class="stat-box"><div class="stat-val">${formatCurrency(totalRevenue)}</div><div class="stat-lbl">إجمالي الإيراد</div></div>
        <div class="stat-box"><div class="stat-val">${formatNumber(totalFuel)} لتر</div><div class="stat-lbl">إجمالي الوقود</div></div>
        <div class="stat-box"><div class="stat-val" style="color:${netProfit>=0?"#15803d":"#991b1b"}">${formatCurrency(netProfit)}</div><div class="stat-lbl">صافي الربح</div></div>
      </div>

      <div class="section">
        <h2>تفصيل التكاليف</h2>
        <table>
          <tr><td style="font-weight:600">إجمالي الإيراد</td><td style="color:#15803d;font-weight:700">${formatCurrency(totalRevenue)}</td></tr>
          <tr><td style="font-weight:600">تكلفة الوقود</td><td style="color:#991b1b">${formatCurrency(totalFuelCost)}</td></tr>
          <tr><td style="font-weight:600">تكاليف الصيانة</td><td style="color:#991b1b">${formatCurrency(maintCost)}</td></tr>
          <tr class="total-row"><td>صافي الربح</td><td style="color:${netProfit>=0?"#15803d":"#991b1b"}">${formatCurrency(netProfit)}</td></tr>
        </table>
      </div>

      ${jobRows ? `
      <div class="section">
        <h2>سجل العمليات (${jobs.length})</h2>
        <table>
          <thead><tr><th>التاريخ</th><th>العميل</th><th>نوع العمل</th><th>الأفدنة</th><th>الإيراد</th></tr></thead>
          <tbody>${jobRows}</tbody>
        </table>
      </div>` : ""}

      ${maintRows ? `
      <div class="section">
        <h2>سجل الصيانة</h2>
        <table>
          <thead><tr><th>التاريخ</th><th>النوع</th><th>ملاحظات</th><th>التكلفة</th></tr></thead>
          <tbody>${maintRows}</tbody>
        </table>
      </div>` : ""}

      <div class="footer">زراعي برو · تقرير معدة: ${equipment.name} · ${today}</div>
    </div>
  `;

  printWindow(html, `تقرير - ${equipment.name}`);
};

// ── 3. Monthly Summary ────────────────────────────────────────────────────────
export const printMonthlySummary = ({ jobs, equipment, maintenance, drivers, fuelPrice, month, year }) => {
  const today = new Date().toLocaleDateString("ar-EG");
  const monthLabel = new Date(year, month - 1).toLocaleDateString("ar-EG", { month:"long", year:"numeric" });

  const prefix = `${year}-${String(month).padStart(2,"0")}`;
  const monthJobs = jobs.filter((j) => j.date?.startsWith(prefix));

  const totalRevenue  = monthJobs.reduce((s, j) => s + (j.acres * j.pricePerAcre), 0);
  const totalAcres    = monthJobs.reduce((s, j) => s + (j.acres || 0), 0);
  const totalFuel     = monthJobs.reduce((s, j) => s + (j.fuelUsed || 0), 0);
  const totalFuelCost = totalFuel * fuelPrice;
  const maintCost     = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const netProfit     = totalRevenue - totalFuelCost - maintCost;

  const equip = [...new Set(monthJobs.map((j) => j.equipmentId))].map((id) => {
    const eq       = equipment.find((e) => e.id === id);
    const eqJobs   = monthJobs.filter((j) => j.equipmentId === id);
    const revenue  = eqJobs.reduce((s, j) => s + (j.acres * j.pricePerAcre), 0);
    const acres    = eqJobs.reduce((s, j) => s + j.acres, 0);
    return `<tr><td>${eq?.name || "—"}</td><td>${eqJobs.length}</td><td>${formatNumber(acres)}</td><td>${formatCurrency(revenue)}</td></tr>`;
  }).join("");

  const html = `
    <div class="page">
      <div class="header">
        <div>
          <h1>التقرير الشهري</h1>
          <p class="brand">زراعي برو · ${monthLabel}</p>
        </div>
        <div class="meta"><p>تاريخ الطباعة: ${today}</p></div>
      </div>

      <div class="grid-2">
        <div class="stat-box"><div class="stat-val">${monthJobs.length} عملية</div><div class="stat-lbl">عدد العمليات</div></div>
        <div class="stat-box"><div class="stat-val">${formatNumber(totalAcres)} فدان</div><div class="stat-lbl">إجمالي الأفدنة</div></div>
        <div class="stat-box"><div class="stat-val">${formatCurrency(totalRevenue)}</div><div class="stat-lbl">إجمالي الإيراد</div></div>
        <div class="stat-box"><div class="stat-val" style="color:${netProfit>=0?"#15803d":"#991b1b"}">${formatCurrency(netProfit)}</div><div class="stat-lbl">صافي الربح</div></div>
      </div>

      <div class="section">
        <h2>ملخص المعدات</h2>
        <table>
          <thead><tr><th>المعدة</th><th>العمليات</th><th>الأفدنة</th><th>الإيراد</th></tr></thead>
          <tbody>${equip}</tbody>
          <tr class="total-row">
            <td>الإجمالي</td>
            <td>${monthJobs.length}</td>
            <td>${formatNumber(totalAcres)}</td>
            <td>${formatCurrency(totalRevenue)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>تفصيل التكاليف</h2>
        <table>
          <tr><td style="font-weight:600">إجمالي الإيراد</td><td style="color:#15803d;font-weight:700">${formatCurrency(totalRevenue)}</td></tr>
          <tr><td style="font-weight:600">تكلفة الوقود</td><td>${formatCurrency(totalFuelCost)}</td></tr>
          <tr><td style="font-weight:600">تكاليف الصيانة</td><td>${formatCurrency(maintCost)}</td></tr>
          <tr class="total-row"><td>صافي الربح</td><td style="color:${netProfit>=0?"#15803d":"#991b1b"}">${formatCurrency(netProfit)}</td></tr>
        </table>
      </div>

      <div class="footer">زراعي برو · التقرير الشهري · ${monthLabel} · ${today}</div>
    </div>
  `;

  printWindow(html, `تقرير ${monthLabel}`);
};

// ── 4. Driver Payslip ─────────────────────────────────────────────────────────
export const printDriverPayslip = ({ driver, month, summary, entries, attendance }) => {
  const today      = new Date().toLocaleDateString("ar-EG");
  const monthLabel = new Date(month + "-01").toLocaleDateString("ar-EG", { month:"long", year:"numeric" });

  const entryRows = entries.map((e) => {
    const isDeduct = e.type === "deduction" || e.type === "advance_repay";
    const typeLabels = {
      base:"راتب أساسي", bonus:"حافز", deduction:"خصم",
      advance:"سلفة", advance_repay:"سداد سلفة",
    };
    return `<tr>
      <td>${formatDate(e.date)}</td>
      <td>${typeLabels[e.type] || e.type}</td>
      <td>${e.reason || e.notes || "—"}</td>
      <td style="color:${isDeduct?"#991b1b":"#15803d"};font-weight:700">
        ${isDeduct ? "-" : "+"} ${formatCurrency(e.amount)}
      </td>
    </tr>`;
  }).join("");

  const attendRows = attendance.map((r) => {
    const labels = { present:"حضر", absent:"غياب", late:"تأخير", half:"نصف يوم" };
    const colors  = { present:"#15803d", absent:"#991b1b", late:"#92400e", half:"#1d4ed8" };
    return `<tr>
      <td>${formatDate(r.date)}</td>
      <td style="color:${colors[r.status]||"#1a1a2e"};font-weight:700">${labels[r.status]||r.status}</td>
      <td>${r.notes||"—"}</td>
    </tr>`;
  }).join("");

  const html = `
    <div class="page">
      <div class="header">
        <div>
          <h1>كشف راتب</h1>
          <p class="brand">زراعي برو · ${monthLabel}</p>
        </div>
        <div class="meta">
          <p>تاريخ الطباعة: ${today}</p>
          <p>السائق: ${driver.name}</p>
          ${driver.phone ? `<p>الهاتف: ${driver.phone}</p>` : ""}
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-box"><div class="stat-val">${formatCurrency(summary.base)}</div><div class="stat-lbl">الراتب الأساسي</div></div>
        <div class="stat-box"><div class="stat-val" style="color:#1d4ed8">${formatCurrency(summary.bonuses)}</div><div class="stat-lbl">الحوافز والزيادات</div></div>
        <div class="stat-box"><div class="stat-val" style="color:#991b1b">${formatCurrency(summary.deductions)}</div><div class="stat-lbl">الخصومات</div></div>
        <div class="stat-box"><div class="stat-val" style="color:${summary.net>=0?"#15803d":"#991b1b"}">${formatCurrency(summary.net)}</div><div class="stat-lbl">صافي الراتب</div></div>
      </div>

      ${entryRows ? `
      <div class="section">
        <h2>تفصيل القيود</h2>
        <table>
          <thead><tr><th>التاريخ</th><th>النوع</th><th>السبب</th><th>المبلغ</th></tr></thead>
          <tbody>${entryRows}</tbody>
          <tr class="total-row">
            <td colspan="3">صافي الراتب</td>
            <td style="color:${summary.net>=0?"#15803d":"#991b1b"}">${formatCurrency(summary.net)}</td>
          </tr>
        </table>
      </div>` : ""}

      ${attendRows ? `
      <div class="section">
        <h2>سجل الحضور والغياب</h2>
        <table>
          <thead><tr><th>التاريخ</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
          <tbody>${attendRows}</tbody>
        </table>
      </div>` : ""}

      <div class="footer">زراعي برو · كشف راتب: ${driver.name} · ${monthLabel} · ${today}</div>
    </div>
  `;

  printWindow(html, `كشف راتب - ${driver.name} - ${monthLabel}`);
};
