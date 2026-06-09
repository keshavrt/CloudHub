<div align="center">

# ☁️ CloudHub

### AI-Powered Event Media & Engagement Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-cloud--hub--kvyk.vercel.app-00C7B7?style=for-the-badge&logo=vercel&logoColor=white)](https://cloud-hub-kvyk.vercel.app)

**CloudHub** is a production-grade, AI-first media management platform built for event organizers and photographers. It combines real-time cloud storage, multi-modal AI analysis, client-side facial recognition, and a role-based permission engine — all in a single cohesive platform.

🌐 **[View Live Demo →](https://cloud-hub-kvyk.vercel.app)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [AI & Machine Learning](#-ai--machine-learning)
- [Access Control Model](#-access-control-model)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)

---

## 🔍 Overview

CloudHub solves a real problem faced by event photographers and club organizers — the chaos of managing hundreds of event photos across different events, teams, and audiences. The platform provides:

- **Structured media organization** across events and albums
- **Granular access control** separating public and club-private content
- **AI-powered workflows** that auto-tag, auto-caption, and auto-discover people in photos
- **Social engagement** through likes, comments, favorites, and tagging
- **Smart photo discovery** — users register a selfie and the system automatically finds them in every event photo across the database

---

## 🚀 Core Features

### 📅 Event & Album Management
- Create events with full metadata: name, date, venue, category, description, and privacy mode (Public / Private).
- Nest albums inside events to organize media by sub-category, day, or photographer.
- Filter and sort the event feed by **Name**, **Date**, or **Category** with instant search.

### 📤 Drag-and-Drop Bulk Upload System
- Dedicated uploader component with a **drag-and-drop file queue** supporting simultaneous multi-file selection.
- **Live upload previews** — view thumbnails, set tags manually, and assign media to a target album before pushing anything to the server.
- Supports both **high-resolution images** (JPEG, PNG, WEBP) and **video files** (MP4, MOV).
- Progress indicators per file with error handling and retry support.

### 🤖 Google Gemini AI Integration
- On every image upload, the raw file bytes are dispatched to **Google Gemini 2.5 Flash** for multi-modal analysis.
- Returns structured semantic tags (e.g. `conference`, `crowd`, `technology`, `award ceremony`) and a social-media style caption automatically saved to the media record.
- Powers the **face-matching pipeline** described below.

### 🧬 Facial Recognition & Personalized Discovery
- Users upload a reference selfie from their Profile page.
- The browser runs **`@vladmandic/face-api`** (SSD MobileNet v1 + Face Landmark 68 model) locally to compute a **128-dimensional face descriptor vector** — no selfie data ever leaves the client in raw form.
- The descriptor is stored server-side. On every new media upload, the system runs a **retroactive face-matching sweep** across all stored face vectors.
- Matches within a configurable cosine similarity threshold automatically tag the user, fire a notification, and surface the photo in the user's **My AI Photos** dashboard.

### 🔒 Role-Based Access Control
Four distinct roles with cascading permissions:

| Role | Capabilities |
|---|---|
| **Viewer** | Browse public events, like/comment, download watermarked media |
| **Club Member** | Viewer + access to private events belonging to their club |
| **Photographer** | Member + create events, upload/delete media, manage albums |
| **Admin** | Full platform access + User Management Portal (role changes, promotions) |

Private event API routes are fully protected server-side — club membership is verified via JWT claims on every request, not just the UI.

### 💬 Social Interactions & Real-Time Notifications
- **Like**, **Comment**, **Favorite**, and **Share** on individual media items.
- **Notification Bell**: Polling-based real-time notification system that alerts users when:
  - Someone likes their uploaded photo.
  - Someone comments on their media.
  - The AI face-matcher spots them in a new photo.
  - An admin manually tags them.
- Notification count badge updates without page refresh.

### 💧 Dynamic Watermarking
- On download, the image is intercepted **client-side** using an HTML5 `<canvas>` element.
- A watermark is composited onto the image containing:
  - **Club Name** + **Event Name** (bottom bar)
  - **User Role** label (bottom-right corner)
  - **Diagonal semi-transparent overlay text** across the center
- The watermarked result is exported as a Blob and saved — zero server-side image processing required.

### 🛡️ Admin User Management Portal
- Accessible via a dedicated **Admin tab** in the navigation — visible only to Admin-role users.
- View all registered users, their roles, clubs, and join dates.
- Promote or demote any user's role in real time with instant database commit.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with server components and API routes |
| **Language** | TypeScript 5 | End-to-end type safety across frontend and backend |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework for responsive, consistent UI |
| **Animations** | Framer Motion | Smooth micro-animations, page transitions, and gesture support |
| **Database** | PostgreSQL 16 | Relational database for all structured platform data |
| **ORM** | Prisma Client | Type-safe query builder and schema migration engine |
| **File Storage** | Supabase Cloud Storage | S3-compatible cloud bucket for images, videos, and avatars |
| **AI Engine** | Google Gemini 2.5 Flash | Multi-modal LLM for image analysis, tagging, and face matching |
| **Face Detection** | `@vladmandic/face-api` | Client-side neural network models for face descriptor generation |
| **Auth** | JWT (HTTP-only Cookies) | Stateless, secure session management |

---

## 🏗️ System Architecture

A full interactive system architecture diagram (Mermaid) is available in [`ARCHITECTURE.md`](ARCHITECTURE.md).

**High-level layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│     Next.js SPA  ·  Tailwind CSS  ·  Framer Motion             │
│     face-api.js (SSD MobileNet — runs entirely in browser)      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│          Next.js API Routes  ·  JWT Middleware                  │
│  /api/auth  /api/events  /api/media  /api/face  /api/notify     │
└──────┬─────────────────┬──────────────────┬─────────────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────────┐
│  PostgreSQL │  │   Supabase    │  │  Google Gemini  │
│  + Prisma   │  │  Cloud Store  │  │   2.5 Flash     │
│  (Metadata) │  │  (Media CDN)  │  │  (AI Analysis)  │
└─────────────┘  └───────────────┘  └─────────────────┘
```

---

## 🗄️ Database Schema

The full schema is defined and versioned in [`prisma/schema.prisma`](prisma/schema.prisma).

**Entity overview:**

```
User ──────┬──── Event ────┬──── Album ───── Media
           │               │                  │
           │               └──── (privacy)     ├──── Like
           │                                   ├──── Comment
           ├──── FaceDescriptor                ├──── Favorite
           │     (128-dim vector)              └──── Tag
           │
           └──── Notification
                 (type: LIKE / COMMENT / TAG / FACE_MATCH)
```

**Key design decisions:**
- `FaceDescriptor` stores the 128-float vector as a `Json` field alongside the user's selfie URL.
- `Media` stores both the raw Supabase CDN URL and an AI-generated tags array for fast search.
- `Event` has a `privacy` enum (`PUBLIC` / `PRIVATE`) and a `clubId` foreign key for membership gating.
- `Notification` is polymorphic — the `entityId` references the triggering media or comment depending on `type`.

---

## 🤖 AI & Machine Learning

### Smart Tagging Pipeline
```
Image Upload → Buffer → Gemini 2.5 Flash (multipart/form-data)
                              ↓
                    JSON Response: { tags[], caption }
                              ↓
                    Saved to Media record in DB
```

### Face Recognition Pipeline
```
User uploads selfie
       ↓
Browser runs face-api.js → 128-dim descriptor vector
       ↓
POST /api/face/register → stored in FaceDescriptor table
       ↓
On every new media upload:
  Retroactive Sweep → compare new photo vs all descriptors
       ↓
  Cosine similarity < threshold → TAG user → NOTIFY user → surface in My AI Photos
```

### Retroactive Matching
When a **new selfie is registered**, the system immediately triggers a background sweep across **all existing media** in the database — so users see their photos from past events the moment they sign up.

---

## 🔐 Access Control Model

```
                  ┌────────────────────────────────────────┐
                  │           JWT Cookie (HTTP-only)        │
                  │  { userId, role, clubId, iat, exp }     │
                  └────────────────┬───────────────────────┘
                                   │ validated on every API request
                  ┌────────────────▼───────────────────────┐
                  │         Middleware checks               │
                  │  role ∈ {VIEWER,MEMBER,PHOTOGRAPHER,   │
                  │           ADMIN}                        │
                  │  clubId matches event.clubId (private)  │
                  └────────────────────────────────────────┘
```

No reliance on client-side role checks for sensitive data — all private media API routes enforce server-side authorization independently.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **PostgreSQL** database (local or hosted)
- A **Supabase** project (for cloud storage)
- A **Google Gemini API key**

### 1. Clone & Install
```bash
git clone https://github.com/keshavrt/CloudHub.git
cd CloudHub
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/cloudhub"
DIRECT_URL="postgresql://user:password@host:5432/cloudhub"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Auth
JWT_SECRET="your-secure-random-secret"
```

### 3. Database Setup
```bash
# Push schema to your database
npx prisma db push

# Seed with demo events, media, users, and interactions
node prisma/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 👤 Demo Accounts

After running the seed, use these accounts to explore each role:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@eventmanager.com` | `AdminPassword123` | Full platform + User Management Portal |
| **Photographer** | `photographer@eventmanager.com` | `PhotoPassword123` | Create events, upload & manage media |
| **Club Member** | `member@eventmanager.com` | `MemberPassword123` | Public + private club events |
| **Viewer** | `viewer@eventmanager.com` | `ViewerPassword123` | Public events only |

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma        # Full database schema (source of truth)
│   └── seed.js              # Demo data seeder
├── public/
│   └── models/              # face-api.js neural network weights (SSD MobileNet v1)
└── src/
    ├── app/
    │   ├── admin/           # Admin-only User Management Portal
    │   ├── api/             # All API route handlers
    │   │   ├── auth/        # Login, logout, register, profile update
    │   │   ├── events/      # CRUD for events and albums
    │   │   ├── media/       # Upload, tag, like, comment, favorite
    │   │   ├── face/        # Face descriptor registration & matching
    │   │   └── notifications/
    │   ├── dashboard/       # Main feed, analytics, search
    │   ├── events/          # Event list & detail pages
    │   ├── media/           # Single media viewer with comments
    │   ├── my-photos/       # Personalized AI-discovered photo feed
    │   └── profile/         # Settings, password change, selfie upload
    ├── components/          # Reusable UI (Navbar, MediaCard, UploadZone…)
    ├── context/             # Global app state & auth context
    └── lib/                 # Service helpers (Gemini, Supabase, Prisma, JWT)
```

---

## 📄 License

This project was built for academic submission. All rights reserved.
