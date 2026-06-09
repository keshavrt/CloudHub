"use client";

import React, { useState, use, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Download, 
  Tag, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles,
  Send,
  Eye,
  Plus,
  Bookmark,
  Share2
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MediaDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const mediaId = resolvedParams.id;

  const { mediaItems, events, likeMediaItem, favoriteMediaItem, shareMediaItem, addComment, currentUser, registeredSelfie, refreshData } = useAppState();
  const media = mediaItems.find(m => m.id === mediaId);
  const event = media ? events.find(e => e.id === media.eventId) : null;

  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState("");
  const [settingCover, setSettingCover] = useState(false);

  const [allUsers, setAllUsers] = useState<{ id: string; name: string; role: string; avatarUrl: string }[]>([]);
  const [selectedUserToTag, setSelectedUserToTag] = useState("");
  const [tagging, setTagging] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to load users list:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleTagUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media || !selectedUserToTag || tagging) return;
    setTagging(true);
    try {
      const selectedUserObj = allUsers.find(u => u.id === selectedUserToTag);
      if (!selectedUserObj) return;

      const res = await fetch(`/api/media/${media.id}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tag",
          taggedUserId: selectedUserToTag,
          name: selectedUserObj.name,
          boundingBox: {}
        })
      });

      if (res.ok) {
        setToast(`Tagged ${selectedUserObj.name}!`);
        setSelectedUserToTag("");
        await refreshData();
        setTimeout(() => setToast(""), 2000);
      } else {
        const err = await res.json();
        alert(`Failed to tag: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error tagging user.");
    } finally {
      setTagging(false);
    }
  };

  const handleSetCover = async () => {
    if (!event || !media) return;
    setSettingCover(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: media.url })
      });
      if (res.ok) {
        setToast("Set as event cover photo!");
        await refreshData();
        setTimeout(() => setToast(""), 2000);
      } else {
        const err = await res.json();
        alert(`Failed to set cover: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error setting cover photo.");
    } finally {
      setSettingCover(false);
    }
  };

  // Listen for share-copy toast events from context
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message ?? "Copied!";
      setToast(msg);
      setTimeout(() => setToast(""), 2500);
    };
    window.addEventListener("em:toast", handler);
    return () => window.removeEventListener("em:toast", handler);
  }, []);

  // Custom tags adding
  const [newTag, setNewTag] = useState("");
  const [tagsState, setTagsState] = useState<string[]>(media?.tags || []);

  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <h2 className="text-xl font-bold text-white">Photo Not Found</h2>
        <Link href="/events" className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-white">
          Back to Events
        </Link>
      </div>
    );
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(media.id, commentText);
    setCommentText("");
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || tagsState.includes(newTag.trim())) return;
    setTagsState(prev => [...prev, newTag.trim()]);
    setNewTag("");
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      // Fetch the image via our API proxy to enforce access control + avoid CORS
      const response = await fetch(`/api/media/${media.id}/download`);
      if (!response.ok) throw new Error("Download not allowed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // If it's a video, skip watermarking and download directly
      if (media.fileType === "video") {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `eventmedia-${event?.name?.replace(/\s+/g, "-") ?? "video"}-${media.id.slice(0, 6)}.${media.url.split('.').pop() || 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        setDownloading(false);
        return;
      }

      // Load image onto a canvas to apply watermark
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // ── Watermark bar ──────────────────────────────────────────────
      const barH = Math.max(48, Math.round(canvas.height * 0.055));
      const fontSize = Math.max(13, Math.round(barH * 0.38));

      // Semi-transparent dark bar at the bottom
      const grad = ctx.createLinearGradient(0, canvas.height - barH, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(1, "rgba(0,0,0,0.80)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

      const clubText = event?.clubName || "N/A";
      const eventText = event?.name || "Event";
      const roleText = currentUser?.role || "Viewer";

      // Left side — Club name + Event name
      ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      const leftText = `${clubText}  |  ${eventText}`;
      ctx.fillText(leftText, 16, canvas.height - barH / 2);

      // Right side — User role
      ctx.font = `${Math.round(fontSize * 0.95)}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = "rgba(200,200,200,0.85)";
      ctx.textAlign = "right";
      const rightText = `Role: ${roleText}`;
      ctx.fillText(rightText, canvas.width - 16, canvas.height - barH / 2);

      // Subtle center diagonal watermark using these parameters only
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.font = `bold ${Math.round(canvas.width * 0.03)}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${clubText} - ${eventText} (${roleText})`, 0, 0);
      ctx.restore();
      // ──────────────────────────────────────────────────────────────

      // Convert canvas to blob and trigger download
      canvas.toBlob((watermarkedBlob) => {
        if (!watermarkedBlob) return;
        const dlUrl = URL.createObjectURL(watermarkedBlob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `eventmedia-${event?.name?.replace(/\s+/g, "-") ?? "photo"}-${media.id.slice(0, 6)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
        URL.revokeObjectURL(objectUrl);
        setDownloading(false);
      }, "image/jpeg", 0.92);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try again.");
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Clipboard toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl animate-fade-in">
          <Share2 size={14} className="text-purple-400" />
          {toast}
        </div>
      )}
      {/* Navigation back */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href={event ? `/events/${event.id}` : "/events"} 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-white transition-colors font-semibold"
        >
          <ArrowLeft size={14} />
          Back to Event
        </Link>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2-cols: Interactive Photo Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center aspect-[4/3] max-h-[70vh]">
            {media.fileType === "video" ? (
              <video
                src={media.url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={media.url}
                alt={media.albumName}
                className="w-full h-full object-contain select-none"
              />
            )}
            {/* Tags overlay in corner */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-10 pointer-events-none">
              {tagsState.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 backdrop-blur-md border border-white/5"
                >
                  <Tag size={10} className="text-zinc-500" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick info toolbar */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-6">
              {/* Like toggle */}
              <button
                onClick={() => likeMediaItem(media.id)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
                  media.likedByMe ? "text-pink-500" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <Heart size={18} fill={media.likedByMe ? "currentColor" : "none"} />
                <span>{media.likes} Likes</span>
              </button>

              {/* Comments counter */}
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <MessageSquare size={18} />
                <span>{media.comments.length} Comments</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Favourite */}
              <button
                onClick={() => favoriteMediaItem(media.id)}
                title={media.favoritedByMe ? "Remove from favourites" : "Add to favourites"}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all cursor-pointer ${
                  media.favoritedByMe
                    ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:text-amber-600 dark:hover:text-amber-400"
                }`}
              >
                <Bookmark size={14} fill={media.favoritedByMe ? "currentColor" : "none"} />
                {media.favoritedByMe ? "Saved" : "Save"}
              </button>

              {/* Share */}
              <button
                onClick={() => shareMediaItem(media.id)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white border border-zinc-200 dark:border-white/5 transition-all cursor-pointer"
              >
                <Share2 size={14} />
                Share
              </button>

              {/* Set as Cover */}
              {(currentUser?.role === "Admin" || currentUser?.role === "Photographer") && media.fileType !== "video" && (
                <button
                  onClick={handleSetCover}
                  disabled={settingCover}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-zinc-200 dark:border-white/5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Sparkles size={14} />
                  {settingCover ? "Setting Cover..." : "Set as Cover"}
                </button>
              )}

              {/* Download with watermark */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-white border border-zinc-200 dark:border-white/5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Watermarking...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1-col: Comments & Details panel */}
        <div className="flex flex-col gap-6">
          {/* Metadata Block */}
          {event && (
            <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Image Information</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500">Belongs to:</span>
                  <Link href={`/events/${event.id}`} className="block mt-1 font-semibold text-zinc-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    {event.name}
                  </Link>
                </div>
                <div className="flex justify-between border-t border-zinc-100 dark:border-white/5 pt-2">
                  <span className="text-zinc-500">Album:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{media.albumName}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 dark:border-white/5 pt-2">
                  <span className="text-zinc-500">Uploaded by:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{media.uploadedBy}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 dark:border-white/5 pt-2">
                  <span className="text-zinc-500">Uploaded:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{new Date(media.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tags modifier */}
              <div className="border-t border-zinc-100 dark:border-white/5 pt-3">
                <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Manage Tags</span>
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <button type="submit" className="rounded-lg bg-purple-500 text-white p-1 hover:bg-purple-600 animate-pulse cursor-pointer">
                    <Plus size={16} />
                  </button>
                </form>
              </div>

              {/* Tag Friends/Users */}
              <div className="border-t border-zinc-100 dark:border-white/5 pt-3">
                <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">People in Photo</span>
                
                {/* Tagged list */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {media.faces.map((face) => (
                    <span
                      key={face.id}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-purple-500/30 px-2.5 py-1 text-[11px] font-medium text-purple-700 dark:text-purple-300"
                    >
                      <User size={10} className="text-purple-500 dark:text-purple-400" />
                      {face.name}
                    </span>
                  ))}
                  {media.faces.length === 0 && (
                    <span className="text-xs text-zinc-400 italic">No friends tagged yet.</span>
                  )}
                </div>

                {/* Tag select form */}
                {currentUser && (
                  <form onSubmit={handleTagUser} className="flex gap-2">
                    <select
                      value={selectedUserToTag}
                      onChange={e => setSelectedUserToTag(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Tag a Friend...</option>
                      {allUsers
                        .filter(u => !media.faces.some(f => f.userId === u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))
                      }
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedUserToTag || tagging}
                      className="rounded-lg bg-purple-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Tag
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-5 flex-1 flex flex-col h-[400px] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-4">Comments Thread</h3>
            
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {media.comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-6 text-zinc-500 text-xs">
                  <MessageSquare size={20} className="mb-1 text-zinc-400" />
                  No comments yet. Be the first to reply!
                </div>
              ) : (
                media.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="h-7 w-7 rounded-full object-cover border border-zinc-200 dark:border-white/10 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{comment.author}</span>
                        <span className="text-[9px] text-zinc-500">
                          {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-normal bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200 dark:border-white/5">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleAddComment} className="mt-4 flex gap-2 border-t border-zinc-200 dark:border-white/10 pt-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a comment..."
                className="flex-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 py-2.5 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-purple-500 p-2.5 text-white hover:bg-purple-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
