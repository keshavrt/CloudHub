const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load env variables
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured in the environment.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing database tables...');

  // Clean existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.faceTag.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.media.deleteMany();
  await prisma.album.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database tables cleared successfully. Seeding new user roles...');

  // Create default password hashes
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const photoPasswordHash = await bcrypt.hash('PhotoPassword123', 10);
  const memberPasswordHash = await bcrypt.hash('MemberPassword123', 10);
  const viewerPasswordHash = await bcrypt.hash('ViewerPassword123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eventmanager.com',
      passwordHash: adminPasswordHash,
      name: 'Sarah Jenkins (Admin)',
      role: 'ADMIN',
      clubName: 'Photography Club',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
  });

  const photographer = await prisma.user.create({
    data: {
      email: 'photographer@eventmanager.com',
      passwordHash: photoPasswordHash,
      name: 'Alex Rivera (Photographer)',
      role: 'PHOTOGRAPHER',
      clubName: 'Media Club',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@eventmanager.com',
      passwordHash: memberPasswordHash,
      name: 'Emma Watson (Club Member)',
      role: 'CLUB_MEMBER',
      clubName: 'Coding Society',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@eventmanager.com',
      passwordHash: viewerPasswordHash,
      name: 'John Doe (Viewer)',
      role: 'VIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
  });

  console.log('Users created. Seeding events, albums, and media assets...');

  // 2. Event 1: Tech Summit 2026 (Public)
  const event1 = await prisma.event.create({
    data: {
      name: 'Global Tech Summit 2026',
      description: 'An international gathering of tech leaders, developers, and startups sharing breakthrough innovations.',
      category: 'Technology',
      date: new Date('2026-07-15T09:00:00Z'),
      location: 'Convention Center, Hall A',
      isPrivate: false,
      clubName: 'Media Club',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    },
  });

  const e1AlbumKeynotes = await prisma.album.create({
    data: {
      name: 'Keynotes',
      description: 'Opening presentations and keynote speeches from industry leaders.',
      eventId: event1.id,
    },
  });

  const e1AlbumWorkshops = await prisma.album.create({
    data: {
      name: 'Workshops',
      description: 'Hands-on technical labs and coding workshops.',
      eventId: event1.id,
    },
  });

  // Media for Tech Summit
  const media1_1 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800',
      fileName: 'keynote-hall.jpg',
      fileType: 'image',
      fileSize: 450000,
      eventId: event1.id,
      albumId: e1AlbumKeynotes.id,
      uploaderId: photographer.id,
      caption: 'Opening keynote session demonstrating future generative AI trends to a packed audience.',
      tags: ['technology', 'keynote', 'seminar', 'audience', 'indoors'],
      isPrivate: false,
    },
  });

  const media1_2 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
      fileName: 'networking.jpg',
      fileType: 'image',
      fileSize: 380000,
      eventId: event1.id,
      albumId: e1AlbumKeynotes.id,
      uploaderId: photographer.id,
      caption: 'Developers and founders networking at the tech lounge during the break.',
      tags: ['networking', 'technology', 'startup', 'gathering', 'crowd'],
      isPrivate: false,
    },
  });

  const media1_3 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
      fileName: 'workshop-lab.jpg',
      fileType: 'image',
      fileSize: 520000,
      eventId: event1.id,
      albumId: e1AlbumWorkshops.id,
      uploaderId: photographer.id,
      caption: 'Attendees writing code together and collaborating during the cloud computing workshop.',
      tags: ['workshop', 'coding', 'teamwork', 'learning', 'indoors'],
      isPrivate: false,
    },
  });

  // 3. Event 2: Summer Music Fest (Public)
  const event2 = await prisma.event.create({
    data: {
      name: 'Summer Music Fest 2026',
      description: 'An open-air music festival featuring rock bands, food trucks, and lively DJ sets.',
      category: 'Festival',
      date: new Date('2026-06-20T16:00:00Z'),
      location: 'Central Park Meadows',
      isPrivate: false,
      clubName: 'Photography Club',
      coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800',
    },
  });

  const e2AlbumMainStage = await prisma.album.create({
    data: {
      name: 'Main Stage',
      description: 'Live performances and artist closeups on the main stage.',
      eventId: event2.id,
    },
  });

  const media2_1 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800',
      fileName: 'concert-performance.jpg',
      fileType: 'image',
      fileSize: 620000,
      eventId: event2.id,
      albumId: e2AlbumMainStage.id,
      uploaderId: admin.id,
      caption: 'Live performance by the headlining rock band as the sun begins to set.',
      tags: ['concert', 'performance', 'music', 'festival', 'stage', 'outdoors'],
      isPrivate: false,
    },
  });

  const media2_2 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
      fileName: 'dj-night.jpg',
      fileType: 'image',
      fileSize: 490000,
      eventId: event2.id,
      albumId: e2AlbumMainStage.id,
      uploaderId: admin.id,
      caption: 'Lively neon lights and energetic crowds dancing during the electronic music DJ set.',
      tags: ['music', 'festival', 'dance', 'lights', 'party', 'crowd'],
      isPrivate: false,
    },
  });

  // 4. Event 3: Annual Club Awards (Private - Restrictive Access Demo)
  const event3 = await prisma.event.create({
    data: {
      name: 'Photography Club Awards Gala',
      description: 'An exclusive private celebration honoring the best media submissions and photographers of the year.',
      category: 'Celebration',
      date: new Date('2026-06-05T19:00:00Z'),
      location: 'Grand Plaza Ballroom',
      isPrivate: true,
      clubName: 'Photography Club',
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    },
  });

  const e3AlbumGala = await prisma.album.create({
    data: {
      name: 'Award Ceremony',
      description: 'The award presentations and formal banquet.',
      eventId: event3.id,
    },
  });

  const media3_1 = await prisma.media.create({
    data: {
      url: 'https://images.unsplash.com/photo-1531058020387-3be344559be6?auto=format&fit=crop&q=80&w=800',
      fileName: 'trophies.jpg',
      fileType: 'image',
      fileSize: 310000,
      eventId: event3.id,
      albumId: e3AlbumGala.id,
      uploaderId: admin.id,
      caption: 'Shiny gold trophies awaiting presentation to our top contributors.',
      tags: ['awards', 'ceremony', 'celebration', 'trophy', 'party'],
      isPrivate: true,
    },
  });

  // 5. Add Social Interactions (Likes, Comments, Favorites)
  // Like media1_1 by admin and member
  await prisma.like.create({ data: { userId: admin.id, mediaId: media1_1.id } });
  await prisma.like.create({ data: { userId: member.id, mediaId: media1_1.id } });

  // Like media2_1 by photographer
  await prisma.like.create({ data: { userId: photographer.id, mediaId: media2_1.id } });

  // Favorite media1_1 and media2_1 for member
  await prisma.favorite.create({ data: { userId: member.id, mediaId: media1_1.id } });
  await prisma.favorite.create({ data: { userId: member.id, mediaId: media2_1.id } });

  // Add Comments
  await prisma.comment.create({
    data: {
      content: 'Absolutely incredible keynote! Loved the vision of next-gen generative applications.',
      userId: admin.id,
      mediaId: media1_1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'The lighting on this shot is phenomenal. What lens did you use?',
      userId: member.id,
      mediaId: media2_1.id,
    },
  });

  // 6. Notifications for demo
  await prisma.notification.create({
    data: {
      userId: photographer.id,
      type: 'like',
      message: 'Sarah Jenkins (Admin) liked your uploaded photo: keynote-hall.jpg.',
      mediaId: media1_1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: photographer.id,
      type: 'comment',
      message: 'Sarah Jenkins (Admin) commented on your photo: "Absolutely incredible keynote!..."',
      mediaId: media1_1.id,
    },
  });

  console.log('Created seeded Events, Albums, Media assets, and social relations.');
  console.log('Database seeding complete and ready for the recording video!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
