"use client";

import { useState, useEffect } from "react";
import { Card, Button, Input } from "@/shared/components";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetHint, setResetHint] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(null);
  const [authMode, setAuthMode] = useState("password");
  const [ssoType, setSsoType] = useState("oidc");
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const [oidcLoginLabel, setOidcLoginLabel] = useState("Sign in with OIDC");
  const [samlConfigured, setSamlConfigured] = useState(false);
  const [samlLoginLabel, setSamlLoginLabel] = useState("Sign in with SAML SSO");
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Countdown for rate-limit
  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  useEffect(() => {
    async function checkAuth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

      try {
        const res = await fetch(`${baseUrl}/api/auth/status`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated === true || data.requireLogin === false) {
            window.location.assign("/dashboard");
            return;
          }
          setHasPassword(!!data.hasPassword);
          setAuthMode(data.authMode || "password");
          setSsoType(data.ssoType || "oidc");
          setOidcConfigured(data.oidcConfigured === true);
          setOidcLoginLabel(data.oidcLoginLabel || "Sign in with OIDC");
          setSamlConfigured(data.samlConfigured === true);
          setSamlLoginLabel(data.samlLoginLabel || "Sign in with SAML SSO");
        } else {
          setHasPassword(true);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setHasPassword(true);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetHint("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mustChangePassword) {
          setMustChange(true);
          return;
        }
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
        if (data.resetHint) setResetHint(data.resetHint);
        if (data.retryAfter) setRetryAfter(Number(data.retryAfter));
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      if (res.ok) {
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to set password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOidcLogin = () => { window.location.href = "/api/auth/oidc/start"; };
  const handleSamlLogin = () => { window.location.href = "/api/auth/saml/start"; };

  const isSsoEnabled = ["sso", "oidc", "saml", "both"].includes(authMode);
  const activeSsoType = ssoType || (authMode === "saml" ? "saml" : "oidc");
  const samlAvailable = isSsoEnabled && activeSsoType === "saml" && samlConfigured;
  const oidcAvailable = isSsoEnabled && activeSsoType === "oidc" && oidcConfigured;
  const ssoAvailable = samlAvailable || oidcAvailable;
  const passwordAvailable = authMode === "password" || authMode === "both" || !ssoAvailable;

  if (hasPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="text-text-muted mt-4 font-medium">Securing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg relative overflow-hidden font-sans">
      {/* Background Decor (Minimalist & Swiss Style) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="landing-grid absolute inset-0 opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 mx-auto bg-black border-2 border-brand-500 rounded-none flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-brand-500 text-[32px]">hub</span>
          </div>
          <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter italic font-heading">SRYROUTER</h1>
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">
            {samlAvailable ? "SAML 2.0 Single Sign-On" 
             : oidcAvailable ? "OIDC Provider Access"
             : "Enterprise Gateway"}
          </p>
        </div>

        <Card elev padding="lg" className="border-2 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(98,129,65,1)] rounded-none">
          {mustChange ? (
            <form onSubmit={handleSetNewPassword} className="space-y-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Update required: Set a secure password before proceeding.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 text-base"
                  required
                  autoFocus
                />
                {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
              </div>
              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} disabled={!newPassword}>
                Secure Account
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              {samlAvailable && (
                <Button type="button" variant="primary" size="lg" fullWidth onClick={handleSamlLogin} className="shadow-md">
                  {samlLoginLabel}
                </Button>
              )}

              {oidcAvailable && (
                <Button type="button" variant="primary" size="lg" fullWidth onClick={handleOidcLogin} className="shadow-md">
                  {oidcLoginLabel}
                </Button>
              )}

              {ssoAvailable && passwordAvailable && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/60"></div>
                  <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-border/60"></div>
                </div>
              )}

              {passwordAvailable ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {isSsoEnabled && !ssoAvailable && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 text-center leading-relaxed">
                        {activeSsoType === "saml" ? "SAML SSO" : "OIDC"} configuration is incomplete. Password login enabled for recovery.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Gateway Access Key</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base"
                      required
                      autoFocus={!oidcAvailable}
                    />
                    
                    <div className="space-y-1 mt-2">
                      {error && (
                        <div role="alert" className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">error</span>
                          <span>{error}</span>
                        </div>
                      )}
                      {retryAfter > 0 && (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Locked. Retry in <span className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">{retryAfter}s</span>
                        </p>
                      )}
                      {resetHint && (
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          Reset: Run <code className="bg-surface-3 px-1 py-0.5 rounded text-text-main font-semibold">SryRouter</code> CLI on host → Settings → Reset Password.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant={ssoAvailable ? "secondary" : "primary"}
                    className="w-full font-bold tracking-wide"
                    size="lg"
                    loading={loading}
                    disabled={retryAfter > 0}
                  >
                    {retryAfter > 0 ? `Wait ${retryAfter}s` : "Authenticate"}
                  </Button>

                  {hasPassword === false && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 text-center">
                        <span className="font-bold">Security Notice:</span> Default key active. You will be prompted to set a new key upon login.
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                error && (
                  <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium text-center">
                    {error}
                  </div>
                )
              )}
            </div>
          )}
        </Card>
        
        <div className="mt-8 text-center space-y-1">
          <p className="text-[11px] text-text-subtle font-semibold uppercase tracking-[0.2em]">
            SryRouter Enterprise
          </p>
          <p className="text-[10px] text-text-muted/60">v0.5.69</p>
        </div>
      </div>
    </div>
  );
}
