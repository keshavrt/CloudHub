"use client";

import React, { useState, use, useRef } from "react";
import { useAppState, EventItem, MediaItem } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FolderOpen, 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Tag, 
  PlusCircle, 
  Sparkles,
  Download,
  Info,
  RefreshCw,
  Trash2,
  Search,
  FolderPlus,
  FolderMinus
} from "lucide-react";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  // Resolve params for Next.js 15+ / React 19
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const { currentUser, events, mediaItems, addMediaItem, deleteMediaItems, refreshData } = useAppState();
  const router = useRouter();
  const [deletingEvent, setDeletingEvent] = useState(false);

  const event = events.find(e => e.id === eventId);

  const handleDeleteEvent = async () => {
    if (!event) return;
    if (!confirm(`Are you sure you want to delete the event "${event.name}"? This will delete all albums and media items associated with it.`)) return;
    setDeletingEvent(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshData();
        router.push("/events");
      } else {
        const err = await res.json();
        alert(`Failed to delete event: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete event error:", err);
      alert("An error occurred while deleting the event.");
    } finally {
      setDeletingEvent(false);
    }
  };
  
  // Default to first album or "All"
  const albums = event ? ["All", ...event.albums] : ["All"];
  const [selectedAlbum, setSelectedAlbum] = useState("All");
  const [mediaSearch, setMediaSearch] = useState("");

  // Photographer drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ file: File; previewUrl: string; album: string; tags: string }[]>([]);
  const [uploadingAll, setUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState(false);

  // Album management state
  const [newAlbumName, setNewAlbumName] = useState("");
  const [addingAlbum, setAddingAlbum] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedMediaIds(new Set());
  };

  const handleSelectMedia = (id: string) => {
    setSelectedMediaIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedMediaIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMediaIds.size} selected photo(s)?`)) return;
    
    setDeletingBatch(true);
    const idsArray = Array.from(selectedMediaIds);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mediaIds: idsArray })
      });

      if (res.ok) {
        deleteMediaItems(idsArray);
        setSelectedMediaIds(new Set());
        setSelectMode(false);
      } else {
        const data = await res.json();
        alert(`Failed to delete photos: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Batch delete error:", err);
      alert("An error occurred while deleting photos.");
    } finally {
      setDeletingBatch(false);
    }
  };

  const handleAddAlbum = async () => {
    const name = newAlbumName.trim();
    if (!name) return;
    setAddingAlbum(true);
    setAlbumError("");
    try {
      const res = await fetch(`/api/events/${eventId}/albums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlbumError(data.error || "Failed to create album.");
      } else {
        setNewAlbumName("");
        // Force context refresh
        await refreshData();
      }
    } catch {
      setAlbumError("Network error.");
    } finally {
      setAddingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`Delete album "${albumName}"? Photos in it will remain but won't be assigned to this album.`)) return;
    setDeletingAlbumId(albumId);
    try {
      const res = await fetch(`/api/events/${eventId}/albums?albumId=${albumId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete album.");
      } else {
        await refreshData();
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeletingAlbumId(null);
    }
  };

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <FolderOpen size={48} className="text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1">The event ID does not match any entry in our catalog.</p>
        <Link href="/events" className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-white">
          Back to Events
        </Link>
      </div>
    );
  }

  // Media filter: album + search by tags, uploader name, or upload date (per PS)
  const eventMedia = mediaItems.filter(m => {
    if (m.eventId !== event.id) return false;
    if (selectedAlbum !== "All" && m.albumName !== selectedAlbum) return false;
    if (mediaSearch) {
      const q = mediaSearch.toLowerCase();
      const matchTag = m.tags.some(t => t.toLowerCase().includes(q));
      const matchUploader = m.uploadedBy.toLowerCase().includes(q);
      const matchDate = new Date(m.uploadedAt).toLocaleDateString().includes(q);
      if (!matchTag && !matchUploader && !matchDate) return false;
    }
    return true;
  });

  const canUpload = currentUser?.role === "Admin" || currentUser?.role === "Photographer";

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFilesToPreview(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFilesToPreview(Array.from(e.target.files));
    }
  };

  const addFilesToPreview = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"));
    
    // Show a warning if some files were skipped
    if (validFiles.length < files.length) {
      alert("Only images and videos are supported. Other file types have been skipped.");
    }

    const newPreviews = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      album: event.albums[0] || "General",
      tags: file.type.startsWith("video/") ? "Video, Live" : "Party, Live, Event"
    }));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviewImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updatePreviewAlbum = (index: number, albumName: string) => {
    setPreviewImages(prev => {
      const updated = [...prev];
      updated[index].album = albumName;
      return updated;
    });
  };

  const updatePreviewTags = (index: number, tagsText: string) => {
    setPreviewImages(prev => {
      const updated = [...prev];
      updated[index].tags = tagsText;
      return updated;
    });
  };

  const handleUploadAll = async () => {
    if (previewImages.length === 0) return;
    setUploadingAll(true);

    for (const item of previewImages) {
      try {
        // Resolve album name to real album UUID
        const albumRef = event.albumRefs?.find(a => a.name === item.album);
        const resolvedAlbumId = albumRef?.id || null;

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("eventId", event.id);
        if (resolvedAlbumId) formData.append("albumId", resolvedAlbumId);
        formData.append("isPrivate", String(event.isPrivate));

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          // Trigger context refresh so new media appears
          addMediaItem({
            eventId: event.id,
            albumName: item.album,
            url: "", // will be refreshed from backend
            fileType: item.file.type.startsWith("video") ? "video" : "image",
            uploadedBy: currentUser?.name || "Photographer",
            uploadedAt: new Date().toISOString(),
            tags: [],
            faces: []
          });
        } else {
          const errData = await res.json();
          console.error("Upload failed:", errData.error);
          alert(`Upload failed: ${errData.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed due to a network error.");
      }
    }

    setPreviewImages([]);
    setUploadingAll(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link 
        href="/events" 
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-6 font-semibold"
      >
        <ArrowLeft size={14} />
        Back to Events
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <img 
              src={event.coverImage} 
              alt={event.name} 
              className="h-20 w-20 rounded-2xl object-cover border border-white/10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400">
                  {event.category}
                </span>
                {event.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                    Archived
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{event.name}</h1>
              {event.clubName && (
                <div className="mt-1 text-sm font-semibold text-purple-400">
                  Hosted by: {event.clubName}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
              </div>
            </div>
          </div>
          {(currentUser?.role === "Admin" || currentUser?.role === "Photographer") && (
            <button
              onClick={handleDeleteEvent}
              disabled={deletingEvent}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/10 transition-colors cursor-pointer border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              {deletingEvent ? "Deleting Event..." : "Delete Event"}
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
          {event.description}
        </p>
      </div>

      {/* Layout Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search + Album tabs header */}
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={mediaSearch}
                onChange={e => setMediaSearch(e.target.value)}
                placeholder="Search by tag, uploader name, or date..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2 pl-8 pr-4 text-xs text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none"
              />
              {mediaSearch && (
                <button onClick={() => setMediaSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            {/* Multi-album tab / Dropdown selectors */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {albums.map((alb) => (
                <button
                  key={alb}
                  onClick={() => setSelectedAlbum(alb)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedAlbum === alb
                      ? "bg-zinc-800 text-purple-400 border border-purple-500/30"
                      : "bg-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  {alb}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 whitespace-nowrap">
              <div className="text-xs text-zinc-500 font-medium">
                Showing {eventMedia.length} of {mediaItems.filter(m => m.eventId === event.id).length} images
              </div>
              
              {canUpload && eventMedia.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectMode ? (
                    <>
                      <button
                        onClick={handleDeleteSelected}
                        disabled={selectedMediaIds.size === 0 || deletingBatch}
                        className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/15"
                      >
                        <Trash2 size={12} />
                        {deletingBatch ? "Deleting..." : `Delete (${selectedMediaIds.size})`}
                      </button>
                      <button
                        onClick={toggleSelectMode}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors border border-white/5"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleSelectMode}
                      className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors"
                    >
                      Select Photos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>{/* end space-y-3 search+tabs wrapper */}

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {eventMedia.map((media) => (
                <MediaCard 
                  key={media.id} 
                  media={media} 
                  selectMode={selectMode}
                  isSelected={selectedMediaIds.has(media.id)}
                  onSelect={handleSelectMedia}
                />
              ))}
            </AnimatePresence>

            {eventMedia.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-2xl">
                <ImageIcon className="mx-auto h-10 w-10 text-zinc-700" />
                <p className="mt-2 text-sm text-zinc-500">No photos available in this album yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Photographer Upload Zone & Meta Info */}
        <div className="space-y-6">
          {/* Upload Zone */}
          {canUpload ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <UploadCloud size={16} />
                  Photographer Desk
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Drag and drop files to stage them in this event's albums.
                </p>
              </div>

              {/* Drop area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? "border-purple-500 bg-purple-500/5" 
                    : "border-white/10 bg-zinc-950/40 hover:bg-zinc-950/80"
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <UploadCloud className="h-8 w-8 text-zinc-500 mb-2 group-hover:text-purple-400" />
                <span className="text-xs font-semibold text-zinc-300">Click or Drag images/videos here</span>
                <span className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPG, WebP, MP4, WebM</span>
              </div>

              {/* Previews List */}
              <AnimatePresence>
                {previewImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Staged Previews ({previewImages.length})</span>
                      <button 
                        onClick={() => setPreviewImages([])}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                      {previewImages.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex gap-3 p-2 rounded-xl bg-zinc-950/60 border border-white/5 relative"
                        >
                          {item.file.type.startsWith("video/") ? (
                            <video 
                              src={item.previewUrl} 
                              className="h-14 w-14 rounded-lg object-cover bg-zinc-900 border border-white/10"
                              muted
                            />
                          ) : (
                            <img 
                              src={item.previewUrl} 
                              alt="preview" 
                              className="h-14 w-14 rounded-lg object-cover bg-zinc-900 border border-white/10"
                            />
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Album Selector */}
                            <select
                              value={item.album}
                              onChange={e => updatePreviewAlbum(idx, e.target.value)}
                              className="w-full bg-zinc-900 text-[11px] text-zinc-300 rounded border border-white/10 p-0.5 focus:outline-none"
                            >
                              {event.albums.map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                            
                            {/* Tags Input */}
                            <div className="flex items-center gap-1 bg-zinc-900 rounded border border-white/10 px-1 py-0.5">
                              <Tag size={10} className="text-zinc-500" />
                              <input
                                type="text"
                                value={item.tags}
                                onChange={e => updatePreviewTags(idx, e.target.value)}
                                placeholder="Tags (comma sep)"
                                className="w-full bg-transparent text-[10px] text-zinc-300 border-none outline-none focus:ring-0 p-0"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => removePreview(idx)}
                            className="absolute -top-1 -right-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white p-0.5 border border-white/10"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleUploadAll}
                      disabled={uploadingAll}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2 text-xs font-semibold text-white shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {uploadingAll ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Publishing to cloud...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Publish {previewImages.length} staged assets
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/20 p-5 text-center">
              <Info className="mx-auto h-6 w-6 text-zinc-600 mb-2" />
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Viewer Mode</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                You are currently viewing this event as a <b>{currentUser?.role || "Visitor"}</b>. To upload photos, toggle your demo role in the navigation bar to "Photographer" or "Admin".
              </p>
            </div>
          )}

          {/* Manage Albums Panel — Admin/Photographer only */}
          {canUpload && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4 backdrop-blur-sm">
              <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <FolderPlus size={15} />
                Manage Albums
              </h4>

              {/* Existing albums list */}
              <div className="space-y-1.5">
                {event.albumRefs && event.albumRefs.length > 0 ? (
                  event.albumRefs.map(alb => (
                    <div key={alb.id} className="flex items-center justify-between rounded-lg border border-white/8 bg-zinc-950/50 px-3 py-2">
                      <span className="text-xs font-semibold text-zinc-200 truncate">{alb.name}</span>
                      <button
                        onClick={() => handleDeleteAlbum(alb.id, alb.name)}
                        disabled={deletingAlbumId === alb.id}
                        className="ml-2 shrink-0 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete album"
                      >
                        {deletingAlbumId === alb.id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : <FolderMinus size={12} />}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 italic">No albums yet.</p>
                )}
              </div>

              {/* Add new album */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={e => setNewAlbumName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddAlbum()}
                    placeholder="New album name..."
                    className="flex-1 rounded-xl border border-white/10 bg-zinc-950 py-2 px-3 text-xs text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleAddAlbum}
                    disabled={addingAlbum || !newAlbumName.trim()}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    {addingAlbum ? <RefreshCw size={11} className="animate-spin" /> : <PlusCircle size={11} />}
                    Add
                  </button>
                </div>
                {albumError && (
                  <p className="text-[10px] text-red-400">{albumError}</p>
                )}
              </div>
            </div>
          )}

          {/* Quick info panel */}
          <div className="rounded-2xl border border-white/15 bg-zinc-900/30 p-5 space-y-3 text-xs text-zinc-400 leading-normal">
            <h4 className="font-bold text-white uppercase tracking-wider">Event Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-zinc-500">Date:</span>
                <span className="text-zinc-300">{event.date}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-zinc-500">Location:</span>
                <span className="text-zinc-300">{event.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Category:</span>
                <span className="text-zinc-300 font-semibold">{event.category}</span>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
