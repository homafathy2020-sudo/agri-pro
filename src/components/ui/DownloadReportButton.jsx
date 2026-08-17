// src/components/ui/DownloadReportButton.jsx
// A small icon-only button meant to sit right next to a "طباعة" (print)
// button on any report. Instead of opening the print dialog, it downloads
// the report straight to the person's device as a real .pdf file.
import React, { useState } from "react";
import toast from "react-hot-toast";
import Button from "./Button";
import { DownloadIcon } from "./Icons";

/**
 * @param onDownload  async function that performs the actual download
 *                     (typically one of the downloadXPdf helpers from
 *                     utils/pdfGenerator.js). Any thrown error's message
 *                     is shown as an error toast.
 */
const DownloadReportButton = ({ onDownload, title = "تحميل PDF", size = "sm", className }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onDownload();
    } catch (err) {
      toast.error(err?.message || "تعذر تحميل الملف — تأكد من اتصالك بالإنترنت وحاول تاني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      loading={loading}
      icon={<DownloadIcon size={16} />}
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={className}
    />
  );
};

export default DownloadReportButton;
