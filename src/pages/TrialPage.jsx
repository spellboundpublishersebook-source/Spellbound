import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import { motion } from "framer-motion";

export default function TrialPage({ onRequestTrial }) {
  const [form, setForm] = useState({ name: "", email: "", institution: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
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
    <div style={{
      minHeight: "calc(100vh - 80px)",
      background: "#F9FAFB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {!sent ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Header (Outside Card) */}
            <motion.div variants={itemVariants} style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: "#111111",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 8px 16px rgba(17,17,17,0.15)",
              }}>
                <Sparkles size={24} color="#FDD132" strokeWidth={2} />
              </div>
              <h1 style={{ ...fontDisplay, color: "#111111", fontSize: "32px", fontWeight: "800", letterSpacing: "0.02em", margin: "0 0 12px" }}>
                Start Your Free Trial
              </h1>
              <p style={{ color: "#000000", fontSize: "16px", margin: 0, lineHeight: "1.6", fontWeight: "500" }}>
                30 days of full access to <span className="font-black uppercase text-red-600" style={fontBody}>SPELLBOUND</span>'s library.<br />
                Approved within one business day.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={itemVariants} style={{ display: "flex", gap: "10px", marginBottom: "32px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Full catalog access", "No credit card", "Cancel anytime"].map(f => (
                <div key={f} style={{
                  background: "#FFFFFF", border: "1px solid #E5E7EB",
                  borderRadius: "100px", padding: "6px 16px",
                  fontSize: "13px", fontWeight: "700", color: "#000000",
                  display: "flex", alignItems: "center", gap: "6px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}>
                  <span style={{ color: "#111111", fontWeight: "900" }}>✓</span> {f}
                </div>
              ))}
            </motion.div>

            {/* Form Card */}
            <motion.div variants={itemVariants} style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                <div style={{ position: "relative" }}>
                  <label style={{ display: "block", color: "#000000", fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Full Name
                  </label>
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      width: "100%", background: "#FFFFFF", border: "1px solid #D1D5DB",
                      padding: "14px 16px", color: "#111111", fontSize: "15px", outline: "none", borderRadius: "10px",
                      transition: "border-color 0.2s, box-shadow 0.2s"
                    }}
                    onFocusCapture={e => { e.target.style.borderColor = "#111111"; e.target.style.boxShadow = "0 0 0 4px rgba(17,17,17,0.05)"; }}
                    onBlurCapture={e => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
                    placeholder="John Smith" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <label style={{ display: "block", color: "#000000", fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Email Address
                  </label>
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      width: "100%", background: "#FFFFFF", border: "1px solid #D1D5DB",
                      padding: "14px 16px", color: "#111111", fontSize: "15px", outline: "none", borderRadius: "10px",
                      transition: "border-color 0.2s, box-shadow 0.2s"
                    }}
                    onFocusCapture={e => { e.target.style.borderColor = "#111111"; e.target.style.boxShadow = "0 0 0 4px rgba(17,17,17,0.05)"; }}
                    onBlurCapture={e => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
                    placeholder="you@institution.edu" type="email" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <label style={{ display: "block", color: "#000000", fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Institution <span style={{ color: "#000000", fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      width: "100%", background: "#FFFFFF", border: "1px solid #D1D5DB",
                      padding: "14px 16px", color: "#111111", fontSize: "15px", outline: "none", borderRadius: "10px",
                      transition: "border-color 0.2s, box-shadow 0.2s"
                    }}
                    onFocusCapture={e => { e.target.style.borderColor = "#111111"; e.target.style.boxShadow = "0 0 0 4px rgba(17,17,17,0.05)"; }}
                    onBlurCapture={e => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
                    placeholder="University or organization name"
                    value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", background: loading ? "#4B5563" : "#111111", color: "#FFFFFF", fontWeight: "700", fontSize: "15px",
                    padding: "16px", borderRadius: "12px", border: "none", cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "8px", boxShadow: "0 4px 12px rgba(17,17,17,0.15)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.background = "#000000"; }}
                  onMouseLeave={e => { if (!loading) e.target.style.background = "#111111"; }}
                >
                  {loading ? "Submitting…" : "Request Free Trial →"}
                </motion.button>

                <p style={{ color: "#000000", fontSize: "13px", textAlign: "center", marginTop: "8px", marginBottom: 0 }}>
                  You'll receive login credentials via email after approval.
                </p>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          /* Success State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ textAlign: "center", padding: "40px 0" }}
          >
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "#F0FDF4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 4px 20px rgba(22, 163, 74, 0.2)"
            }}>
              <CheckCircle2 size={40} color="#16A34A" strokeWidth={2} />
            </div>
            <h2 style={{ ...fontDisplay, color: "#111111", fontSize: "28px", fontWeight: "800", margin: "0 0 12px" }}>
              Request Submitted!
            </h2>
            <p style={{ color: "#000000", fontSize: "15px", lineHeight: "1.6", margin: "0 auto 32px", maxWidth: "340px" }}>
              We've received your request for a 30-day trial. Once the admin approves it, you'll receive your login credentials by email.
            </p>
            <div style={{
              background: "#111111", border: "1px solid #E5E7EB",
              borderRadius: "16px", padding: "16px 24px",
              display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <p style={{ color: "#000000", fontSize: "14px", margin: 0 }}>
                Sent to <span style={{ color: "#111111", fontWeight: "700" }}>{form.email}</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
