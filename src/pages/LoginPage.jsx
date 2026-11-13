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
    if (t === "reader") return "Institution / Department / Student ID";
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
    <div className="admin-glass-backdrop min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="admin-glass-shell flex w-full max-w-[860px] min-h-[540px] rounded-[28px] overflow-hidden"
      >
        
        {/* Left Side: Animated Graphics */}
        <div className="hidden md:flex flex-1 items-center justify-center relative bg-white/25 border-r border-white/50">
          <AnimatedCharacters focusedField={focusedField} mousePos={mousePos} />
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 bg-white/35 backdrop-blur-md p-7 sm:p-10 flex flex-col justify-center">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col w-full"
          >
            {/* Logo / Header */}
            <motion.div variants={itemVariants} className="text-center mb-7 flex flex-col items-center">
              <img src="/logo.png" alt="SpellBound" className="h-28 w-auto mb-3 object-contain" />
              <h2 className="text-3xl font-bold mb-1.5 text-[#111214]" style={fontDisplay}>Welcome back!</h2>
              <p className="text-slate-600 text-sm font-medium">Please enter your credentials</p>
            </motion.div>

            {/* Tab Switcher */}
            {availableTabs.length > 1 && (
              <motion.div variants={itemVariants} className="flex bg-white/60 backdrop-blur-md rounded-full p-1 mb-6 border border-white/90 shadow-sm">
                {availableTabs.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => { setTab(t.id); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        active ? "bg-[#111214] text-[#F5F23B] shadow-md" : "text-slate-600 hover:text-[#111214]"
                      }`}
                    >
                      <t.icon size={15} strokeWidth={2} />
                      {t.label}
                    </button>
                  );
                })}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* ID Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor="login-id-input" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  {labelFor(tab)}
                </label>
                <input
                  id="login-id-input"
                  className="glass-field-control"
                  value={id}
                  onChange={e => setId(e.target.value)}
                  placeholder={tab === "reader" ? "e.g. GVC2026, GVC-CSE, or Student ID" : ""}
                  required
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onFocus={() => setFocusedField("id")}
                  onBlur={() => setFocusedField(null)}
                />
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor="login-password-input" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    className="glass-field-control pr-12"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button
                    type="button"
                    aria-pressed={showPw}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-600 hover:text-[#111214] hover:bg-white/70 transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end items-center text-xs">
                <button type="button" className="text-slate-600 hover:text-[#111214] font-semibold cursor-pointer">
                  Forgot password?
                </button>
              </motion.div>

              {error && (
                <motion.div variants={itemVariants} role="alert" className="rounded-2xl bg-rose-50/90 border border-rose-200 px-4 py-3 text-rose-700 text-sm font-medium">
                  {error}
                </motion.div>
              )}

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#111214] text-[#F5F23B] hover:opacity-95 disabled:opacity-60 font-bold text-sm py-3.5 px-6 rounded-full border-none cursor-pointer shadow-lg transition-all mt-1"
              >
                {loading ? "Signing in…" : "Log In"}
              </motion.button>
            </form>
            
            <motion.div variants={itemVariants} className="mt-7 text-center text-xs text-slate-600">
              Don't have an account? <span className="font-bold text-[#111214]">Contact us for a free trial or institution access</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
