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
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.faceTag.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.media.deleteMany();
  await prisma.album.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

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
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah',
    },
  });

  const photographer = await prisma.user.create({
    data: {
      email: 'photographer@eventmanager.com',
      passwordHash: photoPasswordHash,
      name: 'Alex Rivera (Photographer)',
      role: 'PHOTOGRAPHER',
      clubName: 'Media Club',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex',
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@eventmanager.com',
      passwordHash: memberPasswordHash,
      name: 'Emma Watson (Club Member)',
      role: 'CLUB_MEMBER',
      clubName: 'Coding Society',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=emma',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@eventmanager.com',
      passwordHash: viewerPasswordHash,
      name: 'John Doe (Viewer)',
      role: 'VIEWER',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=john',
    },
  });

  console.log('Created Users:', {
    admin: admin.email,
    photographer: photographer.email,
    member: member.email,
    viewer: viewer.email,
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
