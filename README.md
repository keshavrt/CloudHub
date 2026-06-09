# CloudHub

An AI-powered event media platform for photographers and organizers to upload, manage, and discover event photos with smart tagging and facial recognition.

---

## Features

- **Event & Album Management** — Organize media by events and albums with search, sort, and filter by name, date, or category.
- **Bulk Upload** — Drag-and-drop uploads with preview and pre-tagging before committing.
- **Role-Based Access Control** — Four roles: Viewer, Club Member, Photographer, and Admin. Private events are locked to authorized club members only.
- **AI Smart Tagging** — Google Gemini automatically generates tags and captions on photo upload.
- **Face Recognition** — Register a selfie and the platform finds and tags you across all event photos automatically.
- **Social Interactions** — Like, comment, favorite, and share. Real-time notification bell for activity on your uploads.
- **Dynamic Watermarking** — Downloads are watermarked with the club name, event name, and your role via HTML5 Canvas.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + Framer Motion |
| Database | PostgreSQL + Prisma ORM |
| File Storage | Supabase Cloud Storage (S3-compatible) |
| AI Engine | Google Gemini 2.5 Flash |
| Face Detection | `@vladmandic/face-api` (client-side) |

---

## Project Structure

```
├── prisma/          # Schema and seed data
├── public/          # Static assets and face-api model weights
└── src/
    ├── app/         # Pages and API routes
    │   ├── admin/       # Admin user management
    │   ├── api/         # REST API handlers
    │   ├── dashboard/   # Main feed and analytics
    │   ├── events/      # Event list and detail pages
    │   ├── media/       # Media viewer and download
    │   ├── my-photos/   # AI-discovered personal photos
    │   └── profile/     # User settings and selfie upload
    ├── components/  # Shared UI components
    ├── context/     # Global state (auth, polling)
    └── lib/         # Service helpers (Gemini, Supabase, DB, Auth)
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A PostgreSQL database

### Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@host:5432/cloudhub"
DIRECT_URL="postgresql://user:password@host:5432/cloudhub"

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="your-jwt-secret"
```

### Installation

```bash
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@eventmanager.com` | `AdminPassword123` |
| Photographer | `photographer@eventmanager.com` | `PhotoPassword123` |
| Club Member | `member@eventmanager.com` | `MemberPassword123` |
| Viewer | `viewer@eventmanager.com` | `ViewerPassword123` |

---

## Database Schema

Defined in [`prisma/schema.prisma`](prisma/schema.prisma).
