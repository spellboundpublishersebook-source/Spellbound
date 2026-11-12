import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { motion } from "framer-motion";

export default function TrialPage({ onRequestTrial, onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", institution: "" });
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSubmittedEmail(form.email);
    await new Promise(r => setTimeout(r, 600));
    onRequestTrial(form);
    setSent(true);
    setLoading(false);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="admin-glass-backdrop min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-14" style={fontBody}>
      <div className="w-full max-w-[500px]">
        {!sent ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Header (Outside Card) */}
            <motion.div variants={itemVariants} className="text-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-[#111214] text-[#F5F23B] flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles size={24} strokeWidth={2} />
              </div>
              <h1 style={fontDisplay} className="text-3xl sm:text-4xl font-extrabold text-[#111214] mb-2">
                Start Your Free Trial
              </h1>
              <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                30 days of full access to <span className="font-black uppercase text-red-600">SPELLBOUND</span>'s library.<br />
                Approved within one business day.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={itemVariants} className="flex gap-2.5 mb-7 justify-center flex-wrap">
              {["Full catalog access", "No credit card", "Cancel anytime"].map(f => (
                <div key={f} className="admin-glass-pill rounded-full px-4 py-1.5 text-xs font-bold text-[#111214] flex items-center gap-1.5">
                  <span className="font-black">✓</span> {f}
                </div>
              ))}
            </motion.div>

            {/* Form Card */}
            <motion.div variants={itemVariants} className="admin-glass-panel rounded-[26px] p-7 sm:p-9">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                <div>
                  <label htmlFor="trial-full-name" className="block text-slate-700 text-xs font-bold tracking-wider uppercase mb-1.5">
                    Full Name
                  </label>
                  <input 
                    id="trial-full-name"
                    className="glass-field-control"
                    placeholder="John Smith"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="trial-email" className="block text-slate-700 text-xs font-bold tracking-wider uppercase mb-1.5">
                    Email Address
                  </label>
                  <input 
                    id="trial-email"
                    className="glass-field-control"
                    placeholder="you@institution.edu"
                    type="email"
                    required
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="trial-institution" className="block text-slate-700 text-xs font-bold tracking-wider uppercase mb-1.5">
                    Institution <span className="font-normal normal-case tracking-normal text-slate-500">(optional)</span>
                  </label>
                  <input 
                    id="trial-institution"
                    className="glass-field-control"
                    placeholder="University or organization name"
                    autoComplete="organization"
                    value={form.institution}
                    onChange={e => setForm({ ...form, institution: e.target.value })}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111214] text-[#F5F23B] hover:opacity-95 disabled:opacity-60 font-bold text-sm py-3.5 px-6 rounded-full border-none cursor-pointer shadow-lg transition-all mt-1"
                >
                  {loading ? "Submitting…" : "Request Free Trial →"}
                </motion.button>

                <p className="text-slate-600 text-xs text-center mt-1 mb-0">
                  You'll receive login credentials via email after approval.
                </p>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          /* Success State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="admin-glass-panel rounded-[26px] p-8 sm:p-10 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100/90 border border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle2 size={40} color="#16A34A" strokeWidth={2} />
            </div>
            <h2 style={fontDisplay} className="text-[#111214] text-2xl sm:text-3xl font-extrabold mb-3">
              Request Submitted!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mx-auto mb-7 max-w-[360px]">
              We've received your request for a 30-day trial. Once the admin approves it, you'll receive your login credentials by email.
            </p>
            <div className="bg-[#111214] rounded-2xl px-6 py-3.5 inline-flex items-center justify-center gap-2 shadow-lg mb-7">
              <span className="text-slate-300 text-xs font-medium">
                Sent to
              </span>
              <strong className="text-[#F5F23B] text-xs font-bold">
                {submittedEmail || form.email}
              </strong>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate("catalog");
                  else window.location.hash = "catalog";
                }}
                className="bg-[#F5F23B] text-[#111214] font-bold text-sm px-7 py-3 rounded-full border border-black/10 cursor-pointer shadow-md hover:opacity-95 transition-all"
              >
                Browse Catalog →
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
