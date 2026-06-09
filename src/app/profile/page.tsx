"use client";

import React, { useState } from "react";
import { useAppState } from "@/context/AppContext";
import Link from "next/link";
import { 
  Camera, 
  Settings,
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function ProfilePage() {
  const { currentUser, setCurrentUser, refreshData } = useAppState();

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [avatar, setAvatar] = useState(currentUser?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=default");
  
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [selfie, setSelfie] = useState(currentUser?.selfieUrl || "");
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrentPw, setShowCurrentPw]       = useState(false);
  const [showNewPw, setShowNewPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw]       = useState(false);
  const [pwSaving, setPwSaving]                 = useState(false);
  const [pwFeedback, setPwFeedback]             = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSelfie(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "selfies");

      const res = await fetch("/api/media/upload-raw", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const updateRes = await fetch("/api/auth/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selfieUrl: data.publicUrl })
        });
        if (updateRes.ok) {
          const updateData = await updateRes.json();
          setSelfie(data.publicUrl);
          setCurrentUser(updateData.user);
          await refreshData();
        } else {
          alert("Failed to save selfie to profile.");
        }
      } else {
        const data = await res.json();
        alert(`Failed to upload selfie: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading selfie file.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleDeleteSelfie = async () => {
    if (!confirm("Are you sure you want to remove your AI reference selfie?")) return;
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: null })
      });
      if (res.ok) {
        const data = await res.json();
        setSelfie("");
        setCurrentUser(data.user);
        await refreshData();
      } else {
        alert("Failed to delete selfie.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting selfie.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);

    if (newPassword !== confirmPassword) {
      setPwFeedback({ ok: false, msg: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwFeedback({ ok: false, msg: "Password must be at least 8 characters." });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      setPwFeedback({ ok: true, msg: "Password changed successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwFeedback({ ok: false, msg: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Please Sign In First</h2>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          avatarUrl: avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=default"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        await refreshData();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(`Failed to save profile: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile details.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/media/upload-raw", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAvatar(data.publicUrl);
      } else {
        const data = await res.json();
        alert(`Failed to upload avatar: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading avatar file.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Profile Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Configure your personal profile details and account preferences.
          </p>
        </div>
        <Settings size={24} className="text-purple-600 dark:text-purple-400" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Account Card Overview */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-6 text-center relative overflow-hidden shadow-sm">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-purple-500/5 blur-xl" />
            
            <div className="relative inline-block cursor-pointer group/avatar" onClick={() => document.getElementById("avatar-upload")?.click()}>
              <img
                src={avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=default"}
                alt={name}
                className="mx-auto h-24 w-24 rounded-full object-cover border-2 border-purple-500 shadow-xl group-hover/avatar:opacity-85 transition-opacity"
              />
              <span className="absolute bottom-0 right-0 rounded-full bg-purple-500 p-1.5 text-white border border-zinc-200 dark:border-zinc-900">
                <Camera size={12} />
              </span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">{currentUser.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>

            {/* Role indicator badge */}
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* AI Reference Selfie Card */}
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">AI Face Recognition</h3>
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
              Upload a clear reference selfie to allow the AI model to automatically locate and tag you in event photos.
            </p>

            <div className="space-y-4">
              <div className="relative aspect-square w-full max-w-[160px] mx-auto overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                {selfie ? (
                  <img src={selfie} alt="AI Selfie" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-3 text-zinc-500 flex flex-col items-center gap-1.5">
                    <Camera size={24} className="text-zinc-400" />
                    <span className="text-[10px] font-semibold text-zinc-500">No Selfie Set</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieChange}
                  id="selfie-upload"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("selfie-upload")?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 py-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all cursor-pointer"
                >
                  <Upload size={12} />
                  {uploadingSelfie ? "Uploading..." : selfie ? "Change Selfie" : "Upload Selfie"}
                </button>
                {selfie && (
                  <button
                    type="button"
                    onClick={handleDeleteSelfie}
                    className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-350 transition-colors text-center cursor-pointer"
                  >
                    Remove Selfie
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 2-cols: Profile settings forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Account Details Form */}
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-4">Edit Profile</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    id="avatar-upload"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-white transition-all cursor-pointer"
                  >
                    <Upload size={14} />
                    {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar("https://api.dicebear.com/7.x/adventurer/svg?seed=default")}
                      className="text-xs text-red-650 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg cursor-pointer"
                >
                  {saved ? "Saved Details Successfully!" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Password Change Card ──────────────────────────────────────── */}
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={14} className="text-purple-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2.5 pl-3 pr-10 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                    {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2.5 pl-3 pr-10 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className={`w-full rounded-xl border py-2.5 pl-3 pr-10 text-sm focus:outline-none bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors ${
                        confirmPassword && newPassword !== confirmPassword
                          ? "border-red-400 focus:border-red-400"
                          : "border-zinc-200 dark:border-white/10 focus:border-purple-500"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                      {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {pwFeedback && (
                <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
                  pwFeedback.ok
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {pwFeedback.msg}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  {pwSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Admin Panel Link (Admin only) ─────────────────────────────── */}
          {currentUser.role === "Admin" && (
            <Link
              href="/admin/users"
              className="group flex items-center justify-between rounded-3xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 px-6 py-4 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">User Management</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400">Promote, demote, and manage all registered users.</p>
                </div>
              </div>
              <ExternalLink size={16} className="text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors shrink-0" />
            </Link>
          )}

        </div>

      </div>
    </div>
  );
}
