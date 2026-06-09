"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";

type DBRole = "ADMIN" | "PHOTOGRAPHER" | "CLUB_MEMBER" | "VIEWER";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: DBRole;
  clubName: string | null;
  avatarUrl: string;
  createdAt: string;
}

const ROLE_LABELS: Record<DBRole, string> = {
  ADMIN: "Admin",
  PHOTOGRAPHER: "Photographer",
  CLUB_MEMBER: "Club Member",
  VIEWER: "Viewer",
};

const ROLE_COLORS: Record<DBRole, string> = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  PHOTOGRAPHER: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  CLUB_MEMBER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  VIEWER: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

const ALL_ROLES: DBRole[] = ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER", "VIEWER"];

export default function UserManagementPage() {
  const { currentUser } = useAppState();
  const router = useRouter();

  const [users, setUsers]         = useState<ManagedUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState<string | null>(null); // userId being saved
  const [feedback, setFeedback]   = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, DBRole>>({});
  const [pendingClubs, setPendingClubs] = useState<Record<string, string>>({});

  // Guard: redirect non-admins
  useEffect(() => {
    if (currentUser && currentUser.role !== "Admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  // Fetch all users
  useEffect(() => {
    if (currentUser?.role !== "Admin") return;
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        // initialise pending state to current values
        const roles: Record<string, DBRole> = {};
        const clubs: Record<string, string> = {};
        (data.users || []).forEach((u: ManagedUser) => {
          roles[u.id] = u.role;
          clubs[u.id] = u.clubName || "";
        });
        setPendingRoles(roles);
        setPendingClubs(clubs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleSave = async (userId: string) => {
    setSaving(userId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: pendingRoles[userId],
          clubName: pendingClubs[userId] || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role.");

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: data.user.role, clubName: data.user.clubName }
            : u
        )
      );
      setFeedback({ id: userId, ok: true, msg: "Role updated successfully." });
    } catch (err: any) {
      setFeedback({ id: userId, ok: false, msg: err.message });
    } finally {
      setSaving(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      ROLE_LABELS[u.role].toLowerCase().includes(search.toLowerCase())
  );

  if (!currentUser || currentUser.role !== "Admin") return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg">
            <Users size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">User Management</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Promote, demote, or assign roles to registered users.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
          <Shield size={11} />
          Admin Only
        </span>
      </div>

      {/* Search */}
      <div className="relative mt-6 mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 py-2.5 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-purple-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 py-20 text-center">
          <Users size={28} className="text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-semibold text-zinc-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredUsers.map((user, idx) => {
              const isMe = user.id === currentUser.id;
              const isDirty =
                pendingRoles[user.id] !== user.role ||
                (pendingClubs[user.id] || "") !== (user.clubName || "");
              const needsClub = ["CLUB_MEMBER", "PHOTOGRAPHER", "ADMIN"].includes(
                pendingRoles[user.id]
              );

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          {isMe && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        <span className={`mt-1 inline-flex items-center text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    </div>

                    {/* Role Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      {/* Role selector */}
                      <div className="relative">
                        <select
                          value={pendingRoles[user.id] || user.role}
                          onChange={(e) =>
                            setPendingRoles((prev) => ({
                              ...prev,
                              [user.id]: e.target.value as DBRole,
                            }))
                          }
                          disabled={isMe}
                          className="appearance-none rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 pl-3 pr-8 text-xs font-semibold text-zinc-800 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>

                      {/* Club name field (shown when role needs it) */}
                      {needsClub && !isMe && (
                        <input
                          type="text"
                          placeholder="Club name (optional)"
                          value={pendingClubs[user.id] || ""}
                          onChange={(e) =>
                            setPendingClubs((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 focus:border-purple-500 focus:outline-none w-full sm:w-40"
                        />
                      )}

                      {/* Save button — only shown when something changed */}
                      {isDirty && !isMe && (
                        <button
                          onClick={() => handleSave(user.id)}
                          disabled={!!saving}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-60 cursor-pointer"
                        >
                          {saving === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline feedback */}
                  <AnimatePresence>
                    {feedback?.id === user.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                          feedback.ok
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {feedback.ok ? <Check size={12} /> : <X size={12} />}
                        {feedback.msg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Stats footer */}
      {!loading && users.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_ROLES.map((role) => {
            const count = users.filter((u) => u.role === role).length;
            return (
              <div
                key={role}
                className={`rounded-2xl border p-3 text-center ${ROLE_COLORS[role]}`}
              >
                <div className="text-2xl font-extrabold">{count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
                  {ROLE_LABELS[role]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
