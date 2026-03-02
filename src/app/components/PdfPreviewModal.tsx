"use client";

import { useEffect } from "react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

export function PdfPreviewModal({
  isOpen,
  pdfUrl,
  fileName,
  onClose,
}: PdfPreviewModalProps) {
  // Handle ESC key en prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header met bestandsnaam en sluit-knop */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4d8c7] bg-[#fff8e9]">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <h2 className="text-lg font-semibold text-[#1f1a12] truncate">
              {fileName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e4d8c7] bg-white text-xl font-semibold text-[#b6a58a] transition hover:border-[#dabb7b] hover:bg-[#fff4db] hover:text-[#6b5b46]"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="w-full h-[calc(100%-4rem)] bg-[#f5f0e8]">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}

