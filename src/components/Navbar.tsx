"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppState, UserRole } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Sun, 
  Moon, 
  User, 
  ChevronDown, 
  Shield, 
  Camera, 
  Users, 
  Eye, 
  Menu, 
  X, 
  Sparkles,
  LogOut,
  Check
} from "lucide-react";
import LinkComponent from "next/link"; // Let's import default Link correctly

export default function Navbar() {
  const { 
    currentUser, 
    setCurrentUser, 
    notifications, 
    markNotificationsAsRead, 
    clearNotifications,
    theme, 
    toggleTheme 
  } = useAppState();

  const pathname = usePathname();
  const router = useRouter();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === "/auth") return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const roles: { role: UserRole; icon: React.ReactNode; color: string }[] = [
    { role: "Admin", icon: <Shield size={14} />, color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { role: "Photographer", icon: <Camera size={14} />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { role: "Club Member", icon: <Users size={14} />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { role: "Viewer", icon: <Eye size={14} />, color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" }
  ];



  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Events", href: "/events" },
    ...(currentUser ? [{ name: "My Photos", href: "/my-photos" }] : []),
    { name: "Profile", href: "/profile" }
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    setCurrentUser(null);
    router.push("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <LinkComponent href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              CloudHub
            </span>
          </LinkComponent>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <LinkComponent
                key={link.name}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-zinc-950 dark:hover:text-white ${
                  isActive 
                    ? "text-purple-500 dark:text-purple-400" 
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-indigo-500 to-pink-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </LinkComponent>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* User Role Tag (Static) */}
          {currentUser && (
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                roles.find(r => r.role === currentUser.role)?.color
              }`}
            >
              {roles.find(r => r.role === currentUser.role)?.icon}
              <span>{currentUser.role}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                markNotificationsAsRead();
              }}
              className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl z-20"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 px-3 py-2 pb-2">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Notifications</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto mt-2 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-lg p-2.5 transition-colors ${
                              n.read 
                                ? "bg-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30" 
                                : "bg-purple-500/10 dark:bg-purple-950/20 hover:bg-purple-500/15 dark:hover:bg-purple-950/30"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-medium ${n.read ? "text-zinc-700 dark:text-zinc-300" : "text-purple-600 dark:text-purple-300"}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-zinc-550">{n.time}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 border border-zinc-200 dark:border-white/10 hover:border-purple-500 transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              </button>
            ) : (
              <LinkComponent
                href="/auth"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              >
                <User size={16} />
              </LinkComponent>
            )}

            <AnimatePresence>
              {profileOpen && currentUser && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl z-20"
                  >
                    <div className="border-b border-zinc-200 dark:border-white/10 px-3 py-2">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.name}</p>
                      <p className="text-[11px] text-zinc-550 truncate">{currentUser.email}</p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <LinkComponent
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-colors"
                      >
                        <User size={14} />
                        Profile Settings
                      </LinkComponent>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                      >
                        <LogOut size={14} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-4 space-y-4"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <LinkComponent
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-purple-500/10 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </LinkComponent>
              ))}
            </nav>

            {/* Mobile Role Switched / Profile Options */}
            {currentUser && (
              <div className="border-t border-zinc-200 dark:border-white/10 pt-4">
                <div className="flex items-center gap-3 px-3 py-1.5">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.name}</p>
                    <p className="text-[10px] text-zinc-550">{currentUser.email}</p>
                  </div>
                </div>

                <div className="mt-3 px-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      roles.find(r => r.role === currentUser.role)?.color
                    }`}
                  >
                    {roles.find(r => r.role === currentUser.role)?.icon}
                    <span>{currentUser.role}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
