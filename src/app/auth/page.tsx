"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState, UserRole } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppState();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("photographer@eventmanager.com");
  const [password, setPassword] = useState("PhotoPassword123");
  const [name, setName] = useState("Alex Rivera");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Map backend database roles back to frontend UserRole casings
      const roleMap: Record<string, UserRole> = {
        ADMIN: "Admin",
        PHOTOGRAPHER: "Photographer",
        CLUB_MEMBER: "Club Member",
        VIEWER: "Viewer",
      };

      // Set the user in app context with actual DB records
      setCurrentUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: roleMap[data.user.role] || "Viewer",
        avatarUrl: data.user.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=avatar",
      });

      setLoading(false);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setError("Failed to connect to the server. Make sure the backend is running.");
      setLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            CloudHub
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin ? "Sign in to manage and match your media" : "Join the CloudHub media platform"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
            </div>


            {error && (
              <div className="rounded-lg bg-red-500/15 p-3 text-xs text-red-400 border border-red-500/25">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Register"}</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

        {/* Toggle state */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-semibold text-purple-400 hover:underline">Register here</span></>
              ) : (
                <>Already have an account? <span className="font-semibold text-purple-400 hover:underline">Sign In here</span></>
              )}
            </button>
          </div>
        </div>

        {/* Quick Login Cheat Sheet */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Test Accounts</p>
            <div className="space-y-1.5">
              {[
                { role: "Admin", email: "admin@eventmanager.com", pass: "AdminPassword123" },
                { role: "Photographer", email: "photographer@eventmanager.com", pass: "PhotoPassword123" },
                { role: "Club Member", email: "member@eventmanager.com", pass: "MemberPassword123" },
                { role: "Viewer", email: "viewer@eventmanager.com", pass: "ViewerPassword123" },
              ].map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                  className="w-full flex items-center justify-between rounded-xl bg-zinc-950/50 border border-white/5 px-3 py-2 text-left hover:border-purple-500/30 hover:bg-purple-950/10 transition-all cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-zinc-400">{acc.role}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">{acc.email}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
