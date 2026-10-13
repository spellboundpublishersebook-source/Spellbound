import React from "react";
import { fontBody } from "../theme";

export function Field({ label, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <input
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <select
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function TextArea({ label, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-1.5 text-black">
        {label}
      </label>
      <textarea
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm outline-none resize-y focus:border-[#FDD132] focus:ring-1 focus:ring-[#FDD132] bg-white transition-all shadow-sm"
        style={fontBody}
        {...props}
      />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-gray-100 text-black border border-gray-200",
    good: "bg-green-100 text-green-700 border border-green-200",
    warn: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    bad: "bg-red-100 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-100 p-6 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFF9E6] text-[#FDD132] border border-[#FDEB9E]">
          <Icon size={24} strokeWidth={2} className="text-[#D4A017]" />
        </div>
      )}
      <div>
        <div className="text-3xl font-extrabold text-[#111111] leading-none mb-1">{value}</div>
        <div className="text-xs font-semibold text-black uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto bg-white shadow-2xl border border-gray-100`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-[#111111]">{title}</h3>
          <button onClick={onClose} className="text-sm font-semibold text-black hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
