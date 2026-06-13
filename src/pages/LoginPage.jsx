import { useState, useEffect, useRef } from "react";
import { authAPI } from "../utils/api.js";

const PRIMARY = "#1a56db";
const PRIMARY_DARK = "#1e40af";

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 4) return { score, label: "Good", color: "#3b82f6" };
  return { score, label: "Strong", color: "#10b981" };
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled,
  isPassword = false,
  autoFocus,
  autoComplete, // ✅ FIX 1: Accept autoComplete as a prop
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const inputRef = useRef(null); // ✅ ref to force-focus input from toggle button

  const inputType = isPassword ? (showPwd ? "text" : "password") : type;

  // ✅ FIX 2: Resolve autoComplete correctly — use prop if provided, else fallback
  const resolvedAutoComplete =
    autoComplete !== undefined
      ? autoComplete
      : isPassword
      ? "current-password"
      : type === "email"
      ? "email"
      : "off";

  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          ref={inputRef}
          autoComplete={resolvedAutoComplete} // ✅ FIX 2 applied
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "12px 16px",
            paddingRight: isPassword ? 44 : 16,
            borderRadius: 10,
            border: `1.5px solid ${
              error ? "#fca5a5" : focused ? PRIMARY : "#e2e8f0"
            }`,
            background: error ? "#fff5f5" : focused ? "white" : "#f8fafc",
            boxShadow: focused ? `0 0 0 3px ${PRIMARY}18` : "none",
            fontSize: "16px", // ✅ FIX 3: Must be >= 16px to prevent iOS Safari auto-zoom
            color: "#0f172a",
            outline: "none",
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
            fontFamily: "inherit",
            boxSizing: "border-box",
            opacity: disabled ? 0.6 : 1,
            touchAction: "manipulation",
          }}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            // ✅ FIX: e.preventDefault() stops button stealing focus.
            // inputRef.current?.focus() forces input to get/keep focus on mobile
            onPointerDown={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
            onClick={() => setShowPwd((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#94a3b8",
              padding: 2,
              lineHeight: 1,
              // ✅ FIX 6: Enlarge tap target for mobile
              minWidth: 36,
              minHeight: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showPwd ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#dc2626",
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

export default function LoginPage({ onLogin, dark }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});

  // Register form
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Staff",
  });
  const [regErrors, setRegErrors] = useState({});

  const pwdStrength = getPasswordStrength(regForm.password);

  useEffect(() => {
    setGlobalError("");
    setLoginErrors({});
    setRegErrors({});
  }, [tab]);

  const validateLogin = () => {
    const errors = {};
    if (!loginForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email))
      errors.email = "Invalid email address";
    if (!loginForm.password) errors.password = "Password is required";
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors = {};
    if (!regForm.name.trim() || regForm.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";
    if (!regForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email))
      errors.email = "Invalid email address";
    if (!regForm.password) errors.password = "Password is required";
    else if (regForm.password.length < 8)
      errors.password = "Minimum 8 characters required";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(regForm.password))
      errors.password = "Must include uppercase, lowercase, and a number";
    if (regForm.password !== regForm.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    setGlobalError("");
    try {
      const result = await authAPI.login(
        loginForm.email.trim(),
        loginForm.password
      );
      if (result.success) {
        onLogin(result.data.user);
      } else {
        setGlobalError(result.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setGlobalError(
        err.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    setGlobalError("");
    try {
      const result = await authAPI.register(
        regForm.name.trim(),
        regForm.email.trim(),
        regForm.password,
        regForm.role
      );
      if (result.success) {
        onLogin(result.data.user);
      } else {
        setGlobalError(
          result.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      setGlobalError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      tab === "login" ? handleLogin() : handleRegister();
    }
  };

  const PrimaryBtn = ({ onClick, loading: isLoading, color = PRIMARY, children }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        width: "100%",
        padding: "13px 0",
        background: isLoading
          ? "#93c5fd"
          : `linear-gradient(135deg, ${color}, ${color}dd)`,
        color: "white",
        border: "none",
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        cursor: isLoading ? "not-allowed" : "pointer",
        letterSpacing: "0.02em",
        transition: "opacity 0.2s",
        boxShadow: isLoading ? "none" : `0 4px 14px ${color}50`,
        fontFamily: "inherit",
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        // ✅ FIX 7: Minimum tap target size for mobile accessibility
        minHeight: 48,
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #eff6ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(59,130,246,0.08)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(16,185,129,0.08)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "white",
          borderRadius: 24,
          width: "100%",
          maxWidth: 440,
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          overflow: "clip",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 36px 24px",
            borderBottom: "1px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 14px",
              boxShadow: `0 8px 24px ${PRIMARY}40`,
            }}
          >
            🥛
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 4px",
            }}
          >
            DairyFlow
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#94a3b8",
              margin: 0,
              fontWeight: 500,
            }}
          >
            Smart Dairy Management System
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
          {[
            { key: "login", label: "Sign In" },
            { key: "register", label: "Create Account" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => !loading && setTab(key)}
              style={{
                flex: 1,
                padding: "14px 0",
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? PRIMARY : "#94a3b8",
                borderBottom: `2.5px solid ${
                  tab === key ? PRIMARY : "transparent"
                }`,
                transition: "all 0.2s",
                fontFamily: "inherit",
                // ✅ FIX 7: Minimum tap target
                minHeight: 48,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        {/* ✅ FIX 8: Responsive horizontal padding for small phones */}
        <div style={{ padding: "28px 24px 32px" }}>
          {globalError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "11px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠</span> {globalError}
            </div>
          )}

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <>
              <InputField
                label="Email Address"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                error={loginErrors.email}
                disabled={loading}
                autoFocus
                autoComplete="email"
              />
              <InputField
                label="Password"
                isPassword
                autoComplete="current-password" // ✅ Correct for login
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Enter your password"
                error={loginErrors.password}
                disabled={loading}
              />
              <PrimaryBtn onClick={handleLogin} loading={loading} color={PRIMARY}>
                {loading ? <>⟳ Signing in…</> : "Sign In →"}
              </PrimaryBtn>
              <p
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Don't have an account?{" "}
                <span
                  onClick={() => !loading && setTab("register")}
                  style={{
                    color: PRIMARY,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Create one
                </span>
              </p>
            </>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <>
              <InputField
                label="Full Name"
                value={regForm.name}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Rajesh Kumar"
                error={regErrors.name}
                disabled={loading}
                autoFocus
                autoComplete="name"
              />
              <InputField
                label="Email Address"
                type="email"
                value={regForm.email}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                error={regErrors.email}
                disabled={loading}
                autoComplete="email"
              />

              {/* Role */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Role
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Staff", "Manager", "Admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        !loading && setRegForm((f) => ({ ...f, role: r }))
                      }
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          regForm.role === r ? PRIMARY : "#e2e8f0"
                        }`,
                        background:
                          regForm.role === r ? `${PRIMARY}12` : "transparent",
                        color: regForm.role === r ? PRIMARY : "#64748b",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: regForm.role === r ? 700 : 500,
                        transition: "all 0.15s",
                        fontFamily: "inherit",
                        // ✅ FIX 7: Minimum tap target
                        minHeight: 44,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <InputField
                label="Password"
                isPassword
                autoComplete="new-password" // ✅ FIX 1: Correct for register
                value={regForm.password}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min 8 chars, upper + lower + number"
                error={regErrors.password}
                disabled={loading}
              />

              {/* Password strength */}
              {regForm.password && (
                <div style={{ marginTop: -10, marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i <= Math.ceil(pwdStrength.score / 1.2)
                              ? pwdStrength.color
                              : "#e2e8f0",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: pwdStrength.color,
                      fontWeight: 700,
                    }}
                  >
                    {pwdStrength.label}
                  </div>
                </div>
              )}

              <InputField
                label="Confirm Password"
                isPassword
                autoComplete="new-password" // ✅ FIX 1: Correct for confirm password
                value={regForm.confirmPassword}
                onChange={(e) =>
                  setRegForm((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Re-enter your password"
                error={regErrors.confirmPassword}
                disabled={loading}
              />

              <PrimaryBtn
                onClick={handleRegister}
                loading={loading}
                color="#10b981"
              >
                {loading ? <>⟳ Creating Account…</> : "Create Account →"}
              </PrimaryBtn>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Already have an account?{" "}
                <span
                  onClick={() => !loading && setTab("login")}
                  style={{
                    color: PRIMARY,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Sign in
                </span>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 36px",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            fontSize: 11,
            color: "#cbd5e1",
            fontWeight: 500,
          }}
        >
          🔒 Secured with JWT Authentication · DairyFlow v2.0
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, button { -webkit-tap-highlight-color: transparent; }
        input[type="password"],
        input[type="text"],
        input[type="email"] {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
}
