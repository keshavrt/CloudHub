# CloudHub 🚀
> Next-Generation Event Media & Engagement Platform

CloudHub is a secure, scalable, and AI-powered media platform designed for event organizers and photographers to manage media, organize event-specific albums, and interact in real time. Features include public/private access control, social interactions, Google Gemini-powered smart tagging, dynamic watermarking, and personalized photo discovery using advanced facial recognition.

---

## Key Features

### 📅 1. Event & Album Management
- Organize media by events and custom albums.
- Filter, search, and sort events dynamically by Name, Date, or Category.
- Event metadata includes dates, venues, descriptions, and privacy modes.

### 📤 2. Drag-and-Drop Bulk Uploads
- Staged upload queue with drag-and-drop file support.
- Upload both high-resolution images and videos.
- Preview media, pre-configure tags, and assign files to target albums before committing uploads.

### 🔒 3. Access Control & Role-Based Security
- **Viewer**: Browse public events, download watermarked media, like/comment.
- **Club Member**: Viewer privileges + full access to private events hosted by their club.
- **Photographer**: Member privileges + create events, upload/delete media.
- **Admin**: Full control (User role management, user promotions, and platform stats).
- **Security**: Endpoint guards protect private club media from unauthorized requests.

### 💬 4. Social Interactions & Notifications
- Like, comment, favorite, and share photos or videos.
- Tag friends manually or rely on AI face matching.
- **Real-Time Notification Bell**: Notifies users instantly when someone likes their photo, comments on their upload, or tags them.

### 🤖 5. Google Gemini AI Integrations
- **Smart Image Tagging**: Automatically generates descriptive tags (e.g. `crowd`, `technology`, `workshop`) and social media captions.
- **Face-Matching Discovery**: Compares event photos against user-registered selfies. On matches, it auto-tags the user, issues a notification, and aggregates photos in the user's **My AI Photos** dashboard.
- **Retroactive Matcher**: Triggers background matching across all existing database photos the moment a user uploads a new selfie.

### 💧 6. Dynamic Watermarking
- Automatically watermarks image downloads using HTML5 Canvas.
- Stamps a bottom bar containing the **Club Name**, **Event Name**, and **User Role** along with a diagonal transparent center overlay.

---

## Technology Stack

* **Frontend & Server Components**: Next.js 16 (React 19, TypeScript)
* **Styling**: Tailwind CSS & Framer Motion (for smooth micro-animations)
* **Database & ORM**: PostgreSQL database connected via Prisma Client ORM
* **Cloud Hosting**: Supabase Cloud Bucket Storage (S3-Compatible)
* **Client-Side Face Detection**: `@vladmandic/face-api` (SSD Mobilenet v1 weights)
* **AI Engine**: Google Gemini 2.5 Flash API

---

## Directory Structure
```
event-media-manager/
├── prisma/                  # Database Schema & Seed Data
├── public/                  # Static Assets & face-api model weights
└── src/
    ├── app/                 # Next.js Pages, Layouts, and API Routes
    │   ├── admin/           # Admin User Management Portal
    │   ├── api/             # API Route Handlers (Auth, Events, Media, Face)
    │   ├── dashboard/       # Central Platform Feed & Analytics
    │   ├── events/          # Event list & Detail pages
    │   ├── media/           # Single image viewer, comments, watermarked download
    │   ├── my-photos/       # Personalized face-spotted photo dashboard
    │   └── profile/         # User Settings, Password Change, Selfie Upload
    ├── components/          # Reusable UI Components (Navbar, MediaCard)
    ├── context/             # Global App State (JWT, polling, context synchronizer)
    └── lib/                 # Service Helpers (Gemini, Supabase, Face-api, Auth, DB)
```

---

## Local Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- PostgreSQL Database instance

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cloudhub?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/cloudhub?schema=public"

# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Gemini AI API Configuration
GEMINI_API_KEY="your-gemini-api-key"

# Security Configuration
JWT_SECRET="your-jwt-secret-key"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Deploy database migrations and populate default test credentials:
```bash
npx prisma db push
node prisma/seed.js
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Default Seed Accounts for Testing

Use the following credentials to test different user roles:

| User Profile | Email | Password | Role Permissions |
|---|---|---|---|
| **Sarah Jenkins** | `admin@eventmanager.com` | `AdminPassword123` | **Admin**: Manage roles, full access, stats |
| **Alex Rivera** | `photographer@eventmanager.com` | `PhotoPassword123` | **Photographer**: Create events, upload media, full access |
| **Emma Watson** | `member@eventmanager.com` | `MemberPassword123` | **Club Member**: View private club events, social interactions |
| **John Doe** | `viewer@eventmanager.com` | `ViewerPassword123` | **Viewer**: View public events, social interactions |

---

## Submission Deliverables

- **Architecture Diagram**: Visualized in [ARCHITECTURE.md](ARCHITECTURE.md)
- **Presentation Outline**: Detailed slide-by-slide copy in [PRESENTATION.md](PRESENTATION.md)
- **Prisma Schema**: Declared in [prisma/schema.prisma](prisma/schema.prisma)
