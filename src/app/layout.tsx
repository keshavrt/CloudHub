import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CloudHub — Event & Media Platform",
  description: "CloudHub is a premium AI-powered event media management platform with facial recognition, role-based access, and real-time collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
        <AppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
