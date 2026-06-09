"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Sparkles, Camera, Shield, Users, ArrowRight, Image as ImageIcon } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      title: "AI Face Recognition",
      description: "Upload a selfie to scan all event albums instantly and isolate every photo containing your face.",
    },
    {
      icon: <Camera className="h-6 w-6 text-blue-400" />,
      title: "Photographer Portals",
      description: "Dedicated drag-and-drop workspace supporting instant tag indexing and high-fidelity uploads.",
    },
    {
      icon: <Shield className="h-6 w-6 text-pink-400" />,
      title: "Role-Based Access Control",
      description: "Granular UI changes depending on whether you are an Admin, Photographer, Club Member, or Visitor.",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden flex flex-col justify-center">
      {/* Dynamic neon circles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Subtitle Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          <span>AI-Powered Event Media Platform</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-tight"
        >
          Your events, instantly{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            captured & remembered.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed"
        >
          CloudHub connects organizers, photographers, and attendees under one intelligent platform — powered by AI facial-matching and real-time media management.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-xl hover:bg-zinc-200 transition-all cursor-pointer"
          >
            <span>Enter Dashboard</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/auth"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Sign In / Register
          </Link>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-left backdrop-blur-sm hover:border-purple-500/25 transition-colors group"
            >
              <div className="rounded-xl bg-zinc-900/80 p-3 w-fit border border-white/5 group-hover:scale-105 transition-transform">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
