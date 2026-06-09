"use client";

import React, { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Calendar,
  FolderHeart,
  Sparkles,
  Plus,
  Upload,
  ArrowRight,
  MapPin,
  Search,
  Video,
  Shield,
  Camera,
  Users,
  ScanFace,
  Tag,
  Cloud,
  Lock,
  X,
  Zap,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";

// ─── Capability feature definitions ───────────────────────────────────────────
const CAPABILITIES = [
  {
    icon: <ScanFace size={20} className="text-violet-600 dark:text-violet-400" />,
    gradient: "from-violet-100 to-indigo-50 dark:from-violet-500/20 dark:to-indigo-500/10",
    border: "border-violet-200 dark:border-violet-500/20",
    title: "AI Face Recognition",
    desc: "Upload a selfie and instantly surface every photo containing your face across all event albums.",
  },
  {
    icon: <Camera size={20} className="text-sky-500 dark:text-sky-400" />,
    gradient: "from-sky-100 to-cyan-50 dark:from-sky-500/20 dark:to-cyan-500/10",
    border: "border-sky-200 dark:border-sky-500/20",
    title: "Photographer Portals",
    desc: "Drag-and-drop upload zones with instant AI tagging, album sorting, and high-fidelity storage.",
  },
  {
    icon: <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />,
    gradient: "from-emerald-100 to-green-50 dark:from-emerald-500/20 dark:to-green-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
    title: "Role-Based Access",
    desc: "Admin, Photographer, Club Member, and Viewer roles with granular permission boundaries.",
  },
  {
    icon: <Video size={20} className="text-pink-600 dark:text-pink-400" />,
    gradient: "from-pink-100 to-rose-50 dark:from-pink-500/20 dark:to-rose-500/10",
    border: "border-pink-200 dark:border-pink-500/20",
    title: "Video & Photo Uploads",
    desc: "Upload both high-resolution images and video recordings directly to event albums.",
  },
  {
    icon: <Lock size={20} className="text-amber-600 dark:text-amber-400" />,
    gradient: "from-amber-100 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
    title: "Private Events",
    desc: "Lock events to specific clubs — only authorised members can view or access media.",
  },
  {
    icon: <Users size={20} className="text-purple-600 dark:text-purple-400" />,
    gradient: "from-purple-100 to-fuchsia-50 dark:from-purple-500/20 dark:to-fuchsia-500/10",
    border: "border-purple-200 dark:border-purple-500/20",
    title: "Social Tagging",
    desc: "Tag friends in photos, leave comments, like and bookmark your favourite moments.",
  },
];

export default function DashboardHub() {
  const {
    currentUser,
    events,
    addEvent,
    mediaItems,
  } = useAppState();

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createEventError, setCreateEventError] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form states
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("Concert");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [eventAlbums, setEventAlbums] = useState("");
  const [eventIsPrivate, setEventIsPrivate] = useState(false);
  const [eventClubName, setEventClubName] = useState("");
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  React.useEffect(() => {
    if (currentUser?.clubName) setEventClubName(currentUser.clubName);
  }, [currentUser]);

  // Stats
  const totalMedia = mediaItems.length;
  const totalVideos = mediaItems.filter((m) => m.fileType === "video").length;
  const totalPhotos = totalMedia - totalVideos;
  const activeEvents = events.filter((e) => e.active).length;
  const totalAlbums = events.reduce((acc, e) => acc + (e.albums?.length || 0), 0);
  const totalLikes = mediaItems.reduce((acc, m) => acc + (m.likes || 0), 0);

  const canModify =
    currentUser?.role === "Admin" || currentUser?.role === "Photographer";

  // Filtered media feed
  const filteredMedia = mediaItems.filter((m) => {
    const q = mediaSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const evName = events.find((e) => e.id === m.eventId)?.name.toLowerCase() || "";
    return (
      evName.includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q)) ||
      m.uploadedBy.toLowerCase().includes(q)
    );
  });
  const displayedMedia = mediaSearchQuery ? filteredMedia : filteredMedia.slice(0, 12);
  const savedMedia = mediaItems.filter((m) => m.favoritedByMe);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDate) return;
    setCreatingEvent(true);
    setCreateEventError("");

    let finalCoverUrl =
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800";

    try {
      if (coverFile) {
        setUploadingCover(true);
        const formData = new FormData();
        formData.append("file", coverFile);
        formData.append("folder", "covers");
        const uploadRes = await fetch("/api/media/upload-raw", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(`Cover upload failed: ${err.error || "Unknown"}`);
        }
        finalCoverUrl = (await uploadRes.json()).publicUrl;
      }

      await addEvent({
        name: eventName,
        date: eventDate,
        location: eventLocation,
        description: eventDescription,
        coverImage: finalCoverUrl,
        category: eventCategory,
        albums: eventAlbums.split(",").map((a) => a.trim()).filter(Boolean),
        active: true,
        isPrivate: eventIsPrivate,
        clubName: eventClubName,
      });

      setEventName(""); setEventDate(""); setEventLocation("");
      setEventDescription(""); setCoverFile(null); setEventAlbums("");
      setEventIsPrivate(false); setEventClubName(currentUser?.clubName || "");
      setCreateEventOpen(false);
    } catch (err: any) {
      setCreateEventError(err.message || "Failed to create event.");
    } finally {
      setCreatingEvent(false);
      setUploadingCover(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">

      {/* ── HERO WELCOME STRIP ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-px shadow-2xl shadow-purple-500/20">
        {/* Hero inner is always dark — gradient card, intentional dark canvas */}
        <div className="relative rounded-3xl bg-zinc-950 px-8 py-10 overflow-hidden">
          {/* Background orbs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                  <Cloud size={18} className="text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">CloudHub Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Welcome back{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 text-sm text-zinc-400 max-w-lg">
                Your AI-powered event media hub — capture, organise, and relive every moment across all your events.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {canModify && (
                <button
                  onClick={() => setCreateEventOpen(true)}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  Create Event
                </button>
              )}
              <Link
                href="/events"
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-all shadow-lg"
              >
                Browse Events
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Live Stat Pills — always on dark hero background */}
          <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Photos", value: totalPhotos, icon: <ImageIcon size={14} />, color: "text-sky-400" },
              { label: "Videos", value: totalVideos, icon: <Video size={14} />, color: "text-pink-400" },
              { label: "Events", value: activeEvents, icon: <Calendar size={14} />, color: "text-emerald-400" },
              { label: "Albums", value: totalAlbums, icon: <FolderHeart size={14} />, color: "text-amber-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-4 py-3"
              >
                <span className={`${stat.color} shrink-0`}>{stat.icon}</span>
                <div>
                  <div className="text-xl font-extrabold text-white leading-none">{stat.value}</div>
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PLATFORM CAPABILITIES ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Zap size={16} className="text-purple-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Platform Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`group relative overflow-hidden rounded-2xl border ${cap.border} bg-gradient-to-br ${cap.gradient} p-5 hover:scale-[1.02] transition-transform duration-200 cursor-default`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-xl bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-white/10 p-2.5 shadow-sm">
                  {cap.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{cap.title}</h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT: FEED + SIDEBAR ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left — Media Feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Feed header */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              <TrendingUp size={15} className="text-purple-500" />
              {mediaSearchQuery ? "Search Results" : "Recent Feed"}
            </h2>
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Search by event, tag, uploader..."
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 py-2 pl-8 pr-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Media grid */}
          {displayedMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/20 py-20 text-center">
              <ImageIcon size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No media found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                {mediaSearchQuery ? "Try a different search term" : "Upload photos or videos to an event to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {displayedMedia.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <MediaCard media={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!mediaSearchQuery && filteredMedia.length > 12 && (
            <div className="text-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                View all {filteredMedia.length} items <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-7">

          {/* Quick Actions */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {canModify && (
                <button
                  onClick={() => setCreateEventOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  Create New Event
                </button>
              )}
              <Link
                href="/events"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/5 transition-all"
              >
                Browse All Events <ArrowRight size={12} />
              </Link>
              <Link
                href="/my-photos"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/5 transition-all"
              >
                <ScanFace size={12} />
                My Matched Photos
              </Link>
            </div>

            {/* Role badge */}
            {currentUser && (
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 px-3 py-2.5">
                <div className="h-7 w-7 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0">
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-zinc-500">{currentUser.role}</p>
                </div>
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Active
                </span>
              </div>
            )}
          </div>

          {/* Featured Events */}
          {events.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 pb-3">
                <Calendar size={13} className="text-purple-500" />
                Featured Events
              </h3>
              <div className="space-y-2.5">
                {events.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-2.5 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-all shadow-sm"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={event.coverImage}
                        alt={event.name}
                        className="h-12 w-12 rounded-xl object-cover border border-zinc-100 dark:border-white/5"
                      />
                      {event.active && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">{event.category}</span>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {event.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500">
                        <MapPin size={8} />
                        <span className="truncate">{event.location || "No location"}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {events.length > 5 && (
                <Link
                  href="/events"
                  className="flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
                >
                  +{events.length - 5} more events <ArrowRight size={11} />
                </Link>
              )}
            </div>
          )}

          {/* Saved Favourites */}
          {savedMedia.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 pb-3">
                <FolderHeart size={13} className="text-pink-500" />
                Saved Favourites
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {savedMedia.slice(0, 6).map((item) => (
                  <MediaCard key={item.id} media={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE EVENT MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {createEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCreateEventOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-purple-500" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create New Event</h3>
                </div>
                <button
                  onClick={() => setCreateEventOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Event Name</label>
                  <input
                    type="text" required value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Winter Gala Concert"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
                    <input
                      type="date" required value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="dark:[color-scheme:dark] w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
                    <select
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option>Concert</option>
                      <option>Conference</option>
                      <option>Sports</option>
                      <option>Exhibition</option>
                      <option>Social</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Location</label>
                  <input
                    type="text" required value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Royal Center, NY"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Organizing Club</label>
                  <input
                    type="text" required value={eventClubName}
                    onChange={(e) => setEventClubName(e.target.value)}
                    placeholder="e.g. Photography Club"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={2} value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="A brief summary of the event..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Cover Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file" accept="image/*" id="dashboard-cover-upload"
                      className="hidden"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("dashboard-cover-upload")?.click()}
                      className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-white transition-all cursor-pointer"
                    >
                      <Upload size={13} />
                      {coverFile ? "Change Photo" : "Upload Cover"}
                    </button>
                    {coverFile && (
                      <span className="text-xs text-zinc-500 truncate max-w-[160px]">{coverFile.name}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Albums (Comma Separated)</label>
                  <input
                    type="text" value={eventAlbums}
                    onChange={(e) => setEventAlbums(e.target.value)}
                    placeholder="General, Album 1, Album 2"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-b border-zinc-200 dark:border-white/10">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Private Event</span>
                    <span className="text-[10px] text-zinc-500">Restrict access to club members only.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventIsPrivate(!eventIsPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${eventIsPrivate ? "bg-purple-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${eventIsPrivate ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-bold text-white hover:scale-[1.01] transition-transform active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {creatingEvent || uploadingCover ? "Creating Event..." : "Create Event"}
                </button>

                {createEventError && (
                  <div className="rounded-xl bg-red-500/15 border border-red-500/25 px-4 py-3 text-xs text-red-400">
                    {createEventError}
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
