"use client";

import React from "react";
import Link from "next/link";
import { useAppState, MediaItem } from "@/context/AppContext";
import { motion } from "framer-motion";
import { Heart, MessageSquare, Tag, Eye } from "lucide-react";

interface MediaCardProps {
  media: MediaItem;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export default function MediaCard({ media, selectMode, isSelected, onSelect }: MediaCardProps) {
  const { likeMediaItem, registeredSelfie } = useAppState();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMediaItem(media.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectMode && onSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(media.id);
    }
  };

  const isMatched = media.faces.some(f => f.name.toLowerCase().includes("user") || f.name.toLowerCase().includes("self"));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={selectMode ? {} : { y: -6 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-200 ${
        isSelected 
          ? "border-red-500 ring-2 ring-red-500/20" 
          : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
      }`}
    >
      <Link 
        href={`/media/${media.id}`} 
        onClick={handleCardClick}
        className="block relative aspect-square w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        {/* Selection checkbox */}
        {selectMode && (
          <div className="absolute top-3 right-3 z-30">
            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-150 ${
              isSelected 
                ? "bg-red-500 border-red-500 text-white" 
                : "bg-black/60 border-white/30 hover:border-white/60 text-transparent"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
        )}
        {/* AI Match Badge */}
        {isMatched && registeredSelfie && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/90 border border-purple-400/30 pl-1 pr-2.5 py-0.5 text-[9px] font-bold text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
              <img src={registeredSelfie} className="h-4 w-4 rounded-full object-cover border border-white/20" />
              AI Match
            </span>
          </div>
        )}

        {/* Main Image */}
        {media.fileType === "video" ? (
          <div className="relative w-full h-full">
            <video
              src={media.url}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              preload="metadata"
              muted
            />
            {/* Play badge */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
              <div className="rounded-full bg-white/95 p-3 text-zinc-900 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <img
            src={media.url}
            alt={media.albumName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Backdrop Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4" />

        {/* Hover Details overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Top details - Tag pill */}
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 2).map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[9px] font-semibold text-purple-300 backdrop-blur-sm border border-white/5"
              >
                <Tag size={8} />
                {t}
              </span>
            ))}
          </div>

          {/* Bottom details - Author, Likes & Comments */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-400">
              By <span className="font-semibold text-zinc-200">{media.uploadedBy}</span>
            </p>
            
            <div className="flex items-center justify-between border-t border-white/10 pt-2">
              <div className="flex items-center gap-3">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-xs transition-colors cursor-pointer ${
                    media.likedByMe ? "text-pink-500" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart size={14} fill={media.likedByMe ? "currentColor" : "none"} className={media.likedByMe ? "animate-heartbeat" : ""} />
                  <span>{media.likes}</span>
                </button>

                {/* Comment Counter */}
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <MessageSquare size={14} />
                  <span>{media.comments.length}</span>
                </div>
              </div>

              {/* View detail button */}
              <div className="rounded-full bg-purple-500 p-1.5 text-white shadow-md shadow-purple-500/20">
                <Eye size={12} />
              </div>
            </div>

          </div>
        </div>

        {/* Static small indicator (like a bookmark or tag count) when not hovered */}
        <div className="absolute top-2 right-2 flex gap-1 group-hover:opacity-0 transition-opacity duration-300">
          {media.faces.length > 0 && (
            <span className="flex items-center justify-center rounded-full bg-indigo-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg">
              {media.faces.length} {media.faces.length === 1 ? "Face" : "Faces"}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
