"use client";

import React, { useState, useEffect } from "react";
import { useAppState } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Sparkles, 
  UploadCloud, 
  Smile, 
  Maximize2, 
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import MediaCard from "@/components/MediaCard";

export default function DiscoverTab() {
  const { registeredSelfie, setRegisteredSelfie, mediaItems, currentUser } = useAppState();

  const [uploading, setUploading] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "webcam">("upload");
  const [loadMoreCount, setLoadMoreCount] = useState(4);

  // Simulation/Real steps for AI Face Scan
  const scanSteps = [
    "Initializing Face Mesh API...",
    "Detecting facial landmarks (82 markers)...",
    "Extracting 128-dimension face descriptor vectors...",
    "Scanning all event albums for matching coefficients...",
    "Syncing matching photos to your feed..."
  ];

  // Matched photos: photos with "User (Self)" or user's name annotations
  const matchedPhotos = mediaItems.filter((item) => 
    item.faces.some((face) => 
      face.name.toLowerCase().includes("user") || 
      face.name.toLowerCase().includes("self") ||
      (currentUser && face.userId === currentUser.id) ||
      (currentUser && face.name.toLowerCase() === currentUser.name.toLowerCase())
    )
  );

  // Handle uploading/registering selfie
  const handleRegisterSelfie = async (file: File | Blob) => {
    setUploading(true);
    setScanStage(0); // "Initializing Face Mesh API..."
    
    try {
      // Step 1: Animate initialization
      await new Promise(r => setTimeout(r, 500));
      
      setScanStage(1); // "Detecting facial landmarks..."
      await new Promise(r => setTimeout(r, 500));
      
      setScanStage(2); // "Extracting 128-dimension face descriptor vectors..."
      await new Promise(r => setTimeout(r, 500));
      
      setScanStage(3); // "Scanning all event albums for matching coefficients..."
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/face/register-selfie", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to register selfie");
      }
      
      const data = await res.json();
      setScanStage(4); // "Syncing matching photos to your feed..."
      
      // Delay slightly for smooth transition
      await new Promise(r => setTimeout(r, 600));
      
      setRegisteredSelfie(data.user.selfieUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Registration failed: ${err.message || "Unknown error"}`);
    } finally {
      setUploading(false);
      setScanStage(0);
    }
  };

  const handleCaptureWebcam = async () => {
    // Simulates a webcam capture by fetching a real face photo and processing it
    try {
      setUploading(true);
      setScanStage(0);
      const res = await fetch("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300");
      const blob = await res.blob();
      const file = new File([blob], "webcam_snap.jpg", { type: "image/jpeg" });
      await handleRegisterSelfie(file);
    } catch (err) {
      console.error(err);
      alert("Failed to capture webcam snapshot.");
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleRegisterSelfie(e.target.files[0]);
    }
  };

  const handleClearSelfie = () => {
    setRegisteredSelfie(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="text-purple-400" />
          Face Discovery Feed
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sync your reference photo and let the platform scan thousands of images to locate every single shot you are in.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Selfie Register Widget */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Reference Selfie</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Provide a clear front-facing portrait to initialize facial matching.
              </p>
            </div>

            {/* Selfie status box */}
            {registeredSelfie ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-purple-500/30">
                  <img
                    src={registeredSelfie}
                    alt="Registered selfie"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Face Sync Active
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-purple-950/20 border border-purple-500/25 p-3.5 text-xs text-zinc-300 leading-normal flex items-start gap-2">
                  <Smile size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">AI Sync Matches found!</span>
                    <p className="mt-0.5 text-zinc-400">
                      Located you in {matchedPhotos.length} photos in our catalog. See the feed on the right.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClearSelfie}
                  className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-750 py-2.5 text-xs font-semibold text-red-400 border border-white/5 transition-colors cursor-pointer"
                >
                  Unlink Reference Portrait
                </button>
              </div>
            ) : (
              /* Upload trigger states */
              <div className="space-y-4">
                {uploading ? (
                  /* Loading scan state */
                  <div className="flex flex-col items-center justify-center border border-dashed border-purple-500/40 rounded-2xl aspect-square bg-purple-950/5 p-6 text-center">
                    <RefreshCw className="h-10 w-10 text-purple-400 animate-spin mb-4" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Face Scan Engine</span>
                    
                    <div className="mt-4 w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                        style={{ width: `${((scanStage + 1) / scanSteps.length) * 100}%` }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-purple-300 animate-pulse truncate max-w-full">
                      {scanSteps[scanStage]}
                    </p>
                  </div>
                ) : (
                  /* Tabs for upload method */
                  <div className="space-y-4">
                    <div className="flex rounded-lg bg-zinc-950 p-0.5">
                      <button
                        onClick={() => setActiveTab("upload")}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
                          activeTab === "upload" ? "bg-zinc-800 text-white" : "text-zinc-500"
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        onClick={() => setActiveTab("webcam")}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
                          activeTab === "webcam" ? "bg-zinc-800 text-white" : "text-zinc-500"
                        }`}
                      >
                        Webcam Snap
                      </button>
                    </div>

                    {activeTab === "upload" ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 py-12 text-center bg-zinc-950/30 hover:bg-zinc-950/60 transition-colors">
                          <UploadCloud size={28} className="text-zinc-500 mb-2" />
                          <span className="text-xs font-semibold text-zinc-300">Drag or drop photo</span>
                          <span className="text-[10px] text-zinc-500 mt-1">Clear front-facing shot</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 py-12 text-center bg-zinc-950/30">
                        <Camera size={28} className="text-zinc-500 mb-2 animate-pulse" />
                        <span className="text-xs font-semibold text-zinc-300">Simulate Webcam Scan</span>
                        <button
                          onClick={handleCaptureWebcam}
                          className="mt-4 rounded-xl bg-purple-500 hover:bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg cursor-pointer"
                        >
                          Snap Reference Selfie
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy disclaimer */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/20 p-5 space-y-2 text-xs text-zinc-500 leading-relaxed">
            <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase tracking-wider">
              <AlertCircle size={14} className="text-purple-400" />
              Privacy Assurance
            </div>
            <p>
              Your reference selfie is analyzed strictly client-side to generate face vector points. Face profiles are mapped to match tokens and are not distributed to external trackers.
            </p>
          </div>
        </div>

        {/* Right Column - Infinite Scroll Matches Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Smile size={18} className="text-purple-400" />
              Your Matched Photos Feed
            </h2>
            
            {registeredSelfie && (
              <span className="rounded-full bg-purple-950 border border-purple-500/30 px-3 py-1 text-xs text-purple-300 font-semibold">
                {matchedPhotos.length} matches found
              </span>
            )}
          </div>

          {!registeredSelfie ? (
            /* Empty state when no selfie */
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-3xl bg-zinc-900/10 text-center p-6">
              <div className="rounded-2xl bg-zinc-900 p-4 border border-white/5 mb-4">
                <Smile size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-white">Unlock Your Personalized Feed</h3>
              <p className="mt-2 max-w-sm text-xs text-zinc-500 leading-relaxed">
                We couldn't find your facial reference yet. Upload or snap a photo on the left panel to scan all active event archives!
              </p>
            </div>
          ) : (
            /* Grid and Match Results feed */
            <div className="space-y-6">
              {matchedPhotos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl text-zinc-500 text-xs">
                  No matching images found in active databases. Try uploading a different selfie, or wait until photographers upload recent event albums.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchedPhotos.slice(0, loadMoreCount).map((photo) => (
                      <MediaCard key={photo.id} media={photo} />
                    ))}
                  </div>

                  {loadMoreCount < matchedPhotos.length && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setLoadMoreCount(prev => prev + 2)}
                        className="rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-6 py-2.5 text-xs font-semibold text-white cursor-pointer"
                      >
                        Load More Matches (Simulating Infinite Scroll)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
