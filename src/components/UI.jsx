import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { fontBody, fontDisplay } from "../theme";

export function Field({ label, hint, className = "", id: propId, ...props }) {
  const autoId = useId();
  const fieldId = propId || autoId;
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className="glass-field-control"
        style={fontBody}
        {...props}
      />
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function Select({ label, children, className = "", id: propId, ...props }) {
  const autoId = useId();
  const fieldId = propId || autoId;
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className="glass-field-control cursor-pointer"
        style={fontBody}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function TextArea({ label, className = "", id: propId, ...props }) {
  const autoId = useId();
  const fieldId = propId || autoId;
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className="glass-field-control resize-y"
        style={fontBody}
        {...props}
      />
    </div>
  );
}

export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-slate-100/85 text-slate-800 border border-slate-200/80",
    good: "bg-emerald-100/85 text-emerald-800 border border-emerald-200/80",
    warn: "bg-amber-100/85 text-amber-900 border border-amber-200/80",
    bad: "bg-rose-100/85 text-rose-800 border border-rose-200/80",
  };
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl admin-glass-panel p-6 flex items-center gap-5 transition-all">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#F5F23B] text-[#111214] shadow-sm">
          <Icon size={22} strokeWidth={2} />
        </div>
      )}
      <div>
        <div className="text-3xl font-extrabold text-[#111214] leading-none mb-1" style={fontDisplay}>{value}</div>
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide, maxWidth = null }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Fallback if already open
      }
    }

    const handleCancel = (e) => {
      e.preventDefault();
      onClose?.();
    };
    dialog.addEventListener("cancel", handleCancel);

    // Fallback light-dismiss for browsers lacking closedby="any"
    let cleanPointerFallback = null;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pointerDownTarget = null;
      const onPointerDown = (e) => {
        pointerDownTarget = e.target;
      };
      const onPointerUp = (e) => {
        if (pointerDownTarget !== dialog || e.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const outside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
        if (outside) onClose?.();
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanPointerFallback = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      cleanPointerFallback?.();
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  const handleLightDismissClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose?.();
    }
  };

  const widthClass = maxWidth
    ? maxWidth
    : wide
      ? "max-w-2xl lg:max-w-3xl"
      : "max-w-lg";

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      onClick={handleLightDismissClick}
      className={`app-glass-dialog ${wide ? "app-glass-dialog-wide" : ""} ${widthClass}`}
      style={fontBody}
    >
      <div
        className="app-glass-dialog-surface w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/80 z-20"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(236,241,246,0.56) 100%)",
          }}
        >
          <h3 id={titleId} className="text-base sm:text-lg md:text-xl font-bold text-[#111214] truncate pr-4" style={fontDisplay}>
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 bg-white/85 hover:bg-[#111214] hover:text-[#F5F23B] active:scale-95 px-3.5 py-1.5 rounded-full border border-slate-300/70 shadow-sm transition-all duration-150 cursor-pointer flex-shrink-0"
          >
            <X size={15} strokeWidth={2.2} />
            <span>Close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-[#111214]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
