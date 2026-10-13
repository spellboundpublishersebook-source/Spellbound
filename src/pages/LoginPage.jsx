import React, { useState, useEffect } from "react";
import { GraduationCap, UploadCloud, ShieldCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { fontDisplay } from "../theme";
import { motion } from "framer-motion";

const TABS = [
  { id: "reader", label: "Institution", icon: GraduationCap },
  { id: "uploader", label: "Uploader", icon: UploadCloud },
  { id: "admin", label: "Super Admin", icon: ShieldCheck },
];

const AnimatedCharacters = ({ focusedField, mousePos }) => {
  const calculateOffset = (factor = 1) => {
    if (!mousePos.x && !mousePos.y) return { x: 0, y: 0 };
    const x = (mousePos.x / window.innerWidth - 0.5) * 8 * factor;
    const y = (mousePos.y / window.innerHeight - 0.5) * 8 * factor;
    return { x, y };
  };

  const offset = calculateOffset(1);
  const isPassword = focusedField === "password";

  const purpleEyeStyle = isPassword ? { transform: `translate(0px, 4px) scaleY(0.1)` } : { transform: `translate(${offset.x}px, ${offset.y}px)` };
  const orangeEyeStyle = isPassword ? { transform: `translate(-2px, 4px)` } : { transform: `translate(${offset.x}px, ${offset.y}px)` };
  const blackEyeStyle = isPassword ? { transform: `translate(4px, -4px)` } : { transform: `translate(${offset.x}px, ${offset.y}px)` };

  return (
    <div style={{ position: "relative", width: "300px", height: "300px", margin: "auto" }}>
      {/* Purple Rectangle */}
      <div style={{ position: "absolute", bottom: "30px", left: "60px", width: "90px", height: "180px", backgroundColor: "#7C3AED", borderRadius: "2px", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "30px", left: "20px", display: "flex", gap: "10px" }}>
          <div style={{ width: "8px", height: "8px", backgroundColor: "white", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: "4px", height: "4px", backgroundColor: "black", borderRadius: "50%", position: "absolute", top: "2px", left: "2px", ...purpleEyeStyle, transition: "transform 0.1s" }} />
          </div>
          <div style={{ width: "8px", height: "8px", backgroundColor: "white", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: "4px", height: "4px", backgroundColor: "black", borderRadius: "50%", position: "absolute", top: "2px", left: "2px", ...purpleEyeStyle, transition: "transform 0.1s" }} />
          </div>
        </div>
        <div style={{ position: "absolute", top: "45px", left: "32px", width: "8px", height: "4px", backgroundColor: "black", borderRadius: isPassword ? "4px 4px 0 0" : "0 0 4px 4px", transition: "all 0.3s" }} />
      </div>

      {/* Black Rectangle */}
      <div style={{ position: "absolute", bottom: "30px", left: "125px", width: "55px", height: "110px", backgroundColor: "#24252A", borderRadius: "2px", zIndex: 2 }}>
        <div style={{ position: "absolute", top: "20px", left: "10px", display: "flex", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", backgroundColor: "white", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: "5px", height: "5px", backgroundColor: "black", borderRadius: "50%", position: "absolute", top: "2.5px", left: "2.5px", ...blackEyeStyle, transition: "transform 0.1s" }} />
          </div>
          <div style={{ width: "10px", height: "10px", backgroundColor: "white", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: "5px", height: "5px", backgroundColor: "black", borderRadius: "50%", position: "absolute", top: "2.5px", left: "2.5px", ...blackEyeStyle, transition: "transform 0.1s" }} />
          </div>
        </div>
      </div>

      {/* Yellow Tombstone */}
      <div style={{ position: "absolute", bottom: "30px", left: "165px", width: "65px", height: "90px", backgroundColor: "#E7CA18", borderRadius: "32.5px 32.5px 0 0", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "35px", left: "15px", width: "4px", height: "4px", backgroundColor: "black", borderRadius: "50%", transition: "all 0.2s", transform: isPassword ? "scaleY(0.1)" : "none" }} />
        <div style={{ position: "absolute", top: "48px", left: "25px", width: "40px", height: "4px", backgroundColor: "#24252A", borderRadius: "2px", transform: isPassword ? "translateY(-4px)" : "none", transition: "all 0.3s" }} />
      </div>

      {/* Orange Semicircle */}
      <div style={{ position: "absolute", bottom: "30px", left: "0px", width: "150px", height: "75px", backgroundColor: "#FF8A3C", borderRadius: "75px 75px 0 0", zIndex: 3 }}>
        <div style={{ position: "absolute", top: "35px", left: "60px", display: "flex", gap: "25px" }}>
          <div style={{ width: "6px", height: "6px", backgroundColor: "black", borderRadius: "50%", ...orangeEyeStyle, transition: "transform 0.1s" }} />
          <div style={{ width: "6px", height: "6px", backgroundColor: "black", borderRadius: "50%", ...orangeEyeStyle, transition: "transform 0.1s" }} />
        </div>
        <div style={{ position: "absolute", top: "45px", left: "75px", width: "12px", height: "6px", backgroundColor: "black", borderRadius: isPassword ? "6px 6px 0 0" : "0 0 6px 6px", transition: "all 0.3s", transform: isPassword ? "translateY(2px)" : "none" }} />
      </div>
    </div>
  );
};

export default function LoginPage({ onLogin, mode = "all" }) {
  const availableTabs = mode === "admin" 
    ? TABS.filter(t => t.id === "admin" || t.id === "uploader")
    : mode === "reader" 
      ? TABS.filter(t => t.id === "reader") 
      : TABS;

  const [tab, setTab] = useState(availableTabs[0].id);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    setTimeout(() => {
      const result = onLogin(tab, id, password);
      if (!result.ok) {
        setError(result.message || "Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 600);
  }

  const labelFor = (t) => {
    if (t === "reader") return "Institution / Reader ID";
    if (t === "uploader") return "Uploader ID";
    return "Admin ID";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ 
          display: "flex", 
          width: "100%", 
          maxWidth: "840px", 
          minHeight: "520px",
          backgroundColor: "#E8E8E8", 
          borderRadius: "24px", 
          overflow: "hidden", 
          boxShadow: "0 24px 50px rgba(0,0,0,0.1)" 
        }}
      >
        
        {/* Left Side: Animated Graphics */}
        <div className="hidden md:flex flex-1 items-center justify-center relative">
          <AnimatedCharacters focusedField={focusedField} mousePos={mousePos} />
        </div>

        {/* Right Side: Form */}
        <div style={{ flex: 1, backgroundColor: "transparent", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            {/* Logo / Header */}
            <motion.div variants={itemVariants} style={{ textAlign: "center", marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/logo.png" alt="SpellBound" style={{ height: "140px", width: "auto", marginBottom: "16px", objectFit: "contain" }} />
              <h2 className="text-3xl font-bold mb-2" style={{ ...fontDisplay, color: "#111111" }}>Welcome back!</h2>
              <p style={{ color: "#000000", fontSize: "14px", fontWeight: "500" }}>Please enter your details</p>
            </motion.div>

            {/* Tab Switcher */}
            {availableTabs.length > 1 && (
              <motion.div variants={itemVariants} style={{ display: "flex", background: "#F5F6F8", borderRadius: "12px", padding: "4px", marginBottom: "24px", border: "1px solid #E5E7EB" }}>
                {availableTabs.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setError(""); }}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px",
                        borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700",
                        transition: "all 0.2s", background: active ? "#111111" : "transparent", color: active ? "#FFFFFF" : "#6B7280",
                        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                      }}
                    >
                      <t.icon size={16} strokeWidth={2} />
                      {t.label}
                    </button>
                  );
                })}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* ID Field */}
              <motion.div variants={itemVariants} style={{ position: "relative" }}>
                <label style={{ display: "block", color: "#000000", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  {labelFor(tab)}
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  value={id}
                  onChange={e => setId(e.target.value)}
                  required
                  onFocus={() => setFocusedField("id")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: "100%", background: "#F3F6FA", border: "none",
                    padding: "14px 16px", color: "#111111", fontSize: "15px", outline: "none", borderRadius: "8px",
                  }}
                  onFocusCapture={e => { e.target.style.background = "#EBF0F6"; }}
                  onBlurCapture={e => { e.target.style.background = "#F3F6FA"; }}
                />
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants} style={{ position: "relative" }}>
                <label style={{ display: "block", color: "#000000", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={showPw ? "text" : "password"}
                    required
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: "100%", background: "#F3F6FA", border: "none",
                      padding: "14px 44px 14px 16px", color: "#111111", fontSize: "15px", outline: "none", borderRadius: "8px",
                    }}
                    onFocusCapture={e => { e.target.style.background = "#EBF0F6"; }}
                    onBlurCapture={e => { e.target.style.background = "#F3F6FA"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#000000", cursor: "pointer", padding: "8px" }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", fontSize: "13px" }}>
                <button type="button" style={{ background: "none", border: "none", color: "#000000", cursor: "pointer", padding: 0 }}>
                  Forgot password?
                </button>
              </motion.div>

              {error && (
                <motion.div variants={itemVariants} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px 16px", color: "#DC2626", fontSize: "14px" }}>
                  {error}
                </motion.div>
              )}

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", background: loading ? "#4B5563" : "#1A1A1A", color: "#FFFFFF", fontWeight: "700", fontSize: "15px",
                  padding: "16px", borderRadius: "100px", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "8px", boxShadow: "0 4px 12px rgba(26,26,26,0.15)"
                }}
              >
                {loading ? "Signing in…" : "Log In"}
              </motion.button>
            </form>
            
            <motion.div variants={itemVariants} style={{ marginTop: "32px", textAlign: "center", fontSize: "13px", color: "#000000" }}>
              Don't have an account? <span style={{ fontWeight: "600", color: "#111111", cursor: "pointer" }}>Contact us for a free trial or institution access</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
