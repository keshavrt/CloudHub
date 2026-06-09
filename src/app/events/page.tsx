"use client";

import React, { useState } from "react";
import { useAppState, EventItem } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  MapPin, 
  Folder, 
  Plus, 
  Image as ImageIcon,
  Clock,
  ArrowUpDown,
  X,
  Upload
} from "lucide-react";
import Link from "next/link";

export default function EventsIndex() {
  const { currentUser, events, addEvent } = useAppState();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "date" | "category">("date");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [clubName, setClubName] = useState("");

  // Set default club name
  React.useEffect(() => {
    if (currentUser?.clubName) {
      setClubName(currentUser.clubName);
    }
  }, [currentUser]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Concert");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [albums, setAlbums] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Get distinct categories
  const categories = ["All", ...Array.from(new Set(events.map(e => e.category)))];

  // Filtering & Sorting logic
  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;
    setCreating(true);
    setCreateError("");

    let finalCoverUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800"; // default cover

    try {
      // Upload cover image if selected
      if (coverFile) {
        setUploadingCover(true);
        const formData = new FormData();
        formData.append("file", coverFile);
        formData.append("folder", "covers");
        const uploadRes = await fetch("/api/media/upload-raw", {
          method: "POST",
          body: formData
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(`Cover image upload failed: ${err.error || "Unknown error"}`);
        }
        const uploadData = await uploadRes.json();
        finalCoverUrl = uploadData.publicUrl;
      }

      await addEvent({
        name,
        date,
        location,
        description,
        coverImage: finalCoverUrl,
        category,
        albums: albums.split(",").map(a => a.trim()).filter(Boolean),
        active: true,
        isPrivate,
        clubName
      });

      // Reset Form
      setName("");
      setDate("");
      setLocation("");
      setDescription("");
      setCoverFile(null);
      setAlbums("");
      setIsPrivate(false);
      setClubName(currentUser?.clubName || "");
      setCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create event. Please try again.");
    } finally {
      setCreating(false);
      setUploadingCover(false);
    }
  };

  const isPhotographerOrAdmin = currentUser?.role === "Admin" || currentUser?.role === "Photographer";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Event Galleries</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse through albums, search for active events, or find pictures matched to your profile.
          </p>
        </div>

        {isPhotographerOrAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg cursor-pointer"
          >
            <Plus size={16} />
            Create Event
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search events by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Sorting and category quick filters */}
        <div className="flex w-full md:w-auto items-center justify-end gap-3 flex-wrap">
          {/* Sorting */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300">
            <ArrowUpDown size={14} className="text-zinc-400 dark:text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-100 outline-none cursor-pointer focus:ring-0 border-none p-0"
            >
              <option value="name">Event Name (A-Z)</option>
              <option value="date">Date of Event</option>
              <option value="category">Category (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all duration-200 ${
              selectedCategory === cat
                ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/10"
                : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/30 backdrop-blur-sm shadow-xl hover:border-zinc-300 dark:hover:border-white/20 transition-colors"
            >
              {/* Event Cover Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                <img
                  src={event.coverImage}
                  alt={event.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay details */}
                <div className="absolute top-3 right-3 flex gap-1.5 items-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${event.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Event Info */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Calendar size={12} className="text-zinc-400" />
                  <span>{new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>

                <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {event.name}
                </h3>
                
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                {/* Meta details */}
                <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span className="truncate max-w-[120px]">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><Folder size={11} /> {event.albums.length} albums</span>
                    <span className="flex items-center gap-0.5"><ImageIcon size={11} /> {event.totalPhotos} photos</span>
                  </div>
                </div>

                {/* View Details Link */}
                <Link
                  href={`/events/${event.id}`}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-white/5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-white transition-colors"
                >
                  Explore Albums
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Folder className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">No Events Found</h3>
            <p className="mt-1 text-xs text-zinc-550 dark:text-zinc-500">Try adjusting your search criteria or filter tags.</p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCreateModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Create New Event</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Winter Gala Concert"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="color-scheme-normal dark:[color-scheme:dark] w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Concert">Concert</option>
                      <option value="Conference">Conference</option>
                      <option value="Sports">Sports</option>
                      <option value="Exhibition">Exhibition</option>
                      <option value="Social">Social</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Royal Center, NY"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Organizing Club</label>
                  <input
                    type="text"
                    required
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="e.g. Photography Club"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="A brief summary of the event..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Cover Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="event-cover-upload"
                      className="hidden"
                      onChange={e => setCoverFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("event-cover-upload")?.click()}
                      className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-850 dark:text-white transition-all hover:bg-zinc-200 cursor-pointer"
                    >
                      <Upload size={14} />
                      {coverFile ? "Change Photo" : "Upload Cover Image"}
                    </button>
                    {coverFile && (
                      <span className="text-xs text-zinc-550 dark:text-zinc-400 truncate max-w-[180px]">
                        {coverFile.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Albums (Comma Separated)</label>
                  <input
                    type="text"
                    value={albums}
                    onChange={e => setAlbums(e.target.value)}
                    placeholder="General, Album 1, Album 2"
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2 px-3 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-b border-zinc-200 dark:border-white/10 my-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">Private Event</span>
                    <span className="text-[10px] text-zinc-500">Restricts media access to organizing club members only.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPrivate ? "bg-purple-600" : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPrivate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white hover:scale-[1.01] transition-transform active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {creating || uploadingCover ? "Creating Event..." : "Create Event"}
                </button>

                {createError && (
                  <div className="rounded-xl bg-red-500/15 border border-red-500/25 px-4 py-3 text-xs text-red-400">
                    {createError}
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
