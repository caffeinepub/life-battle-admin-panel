import { Eye, EyeOff, Loader2, Shield, Sword, UserCog } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, loginHost } from "../lib/auth";

type Tab = "admin" | "host";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("admin");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setId("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (tab === "admin") {
      const success = loginAdmin(id, password);
      setLoading(false);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid Admin ID or Password");
      }
    } else {
      const result = await loginHost(id, password);
      setLoading(false);
      if (result.success) {
        navigate("/host");
      } else {
        setError("Invalid Host username or password");
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, oklch(0.25 0.08 290 / 0.4) 0%, oklch(0.14 0.012 285) 60%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.8 0.14 200) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0.14 200) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div
          className="absolute -inset-1 rounded-2xl blur-xl opacity-30"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.58 0.22 290), oklch(0.82 0.14 200))",
          }}
        />

        <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-xl mb-4 border border-primary/40"
              style={{ background: "oklch(0.22 0.05 290)" }}
            >
              <Sword className="w-8 h-8 text-primary" />
            </div>
            <h1
              className="text-3xl font-bold text-gradient-purple"
              style={{
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              LIFE BATTLE
            </h1>
            <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
              Management Panel
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-border overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => handleTabChange("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                tab === "admin"
                  ? "bg-primary/20 text-primary border-r border-border"
                  : "text-muted-foreground hover:text-foreground border-r border-border"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("host")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                tab === "host"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCog className="w-4 h-4" />
              Host
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-id"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5"
              >
                {tab === "admin" ? "Admin ID" : "Username"}
              </label>
              <input
                id="login-id"
                data-ocid="login.input"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={
                  tab === "admin" ? "Enter admin ID" : "Enter username"
                }
                required
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                data-ocid="login.error_state"
                className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-sm text-destructive"
              >
                <span>⚠</span> {error}
              </div>
            )}

            <button
              data-ocid="login.submit_button"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-md transition-all glow-purple mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : tab === "admin" ? (
                "LOGIN AS ADMIN"
              ) : (
                "LOGIN AS HOST"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
