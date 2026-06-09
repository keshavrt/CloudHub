"use client";

import React from "react";
import { useAppState } from "@/context/AppContext";
import { motion } from "framer-motion";
import { Sparkles, User, Camera, ArrowRight, ImageIcon } from "lucide-react";
import Link from "next/link";
import MediaCard from "@/components/MediaCard";

export default function MyPhotosPage() {
  const { currentUser, mediaItems } = useAppState();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Please Sign In First</h2>
        <p className="mt-2 text-xs text-zinc-500">Sign in to view your personalized photos.</p>
        <Link href="/auth" className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-white">
          Sign In
        </Link>
      </div>
    );
  }

  const hasSelfie = !!currentUser.selfieUrl;
  
  // Filter media items where user is tagged
  const myPhotos = mediaItems.filter(m => 
    m.faces.some(f => f.userId === currentUser.id)
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-purple-600 dark:text-purple-400" size={26} />
          My AI Photos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Photos where the AI or a friend has tagged you across all event albums.
        </p>
      </div>

      {!hasSelfie && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl border border-purple-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 p-6 md:p-8 text-center shadow-sm"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
            <Camera size={24} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Unlock AI Face Spotting</h2>
          <p className="mt-2 max-w-md mx-auto text-xs leading-relaxed text-zinc-650 dark:text-zinc-400">
            Upload a reference selfie in your profile settings. Once set, our AI will automatically locate and tag you in any photo uploaded by club photographers!
          </p>
          <Link
            href="/profile"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-md"
          >
            Upload Reference Selfie
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {hasSelfie && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Spotted in {myPhotos.length} photo{myPhotos.length !== 1 && "s"}
            </span>
          </div>

          {myPhotos.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/10 py-20 text-center text-zinc-500 flex flex-col items-center gap-2 shadow-sm">
              <ImageIcon size={32} className="text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-400">No spotted photos yet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-xs leading-relaxed">
                We couldn't find you in any of the uploaded galleries yet. Make sure your reference selfie is clear, and keep checking back!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {myPhotos.map((photo) => (
                <MediaCard key={photo.id} media={photo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
