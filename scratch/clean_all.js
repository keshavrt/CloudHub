const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured in the environment.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Key not configured. Skipping bucket cleanup.');
}

const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function cleanBucket(bucketName) {
  if (!supabase) return;
  console.log(`Cleaning Supabase storage bucket: "${bucketName}"...`);
  
  try {
    // List all files at the root of the bucket
    let { data: items, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
    });
    
    if (error) {
      console.error(`Error listing bucket ${bucketName}:`, error.message);
      return;
    }
    
    if (!items || items.length === 0) {
      console.log(`Bucket "${bucketName}" is already empty.`);
      return;
    }
    
    const files = [];
    const folders = [];
    for (const item of items) {
      if (item.id === null) {
        folders.push(item.name);
      } else {
        files.push(item.name);
      }
    }
    
    if (files.length > 0) {
      console.log(`Removing files: ${files.join(', ')}`);
      const { error: removeError } = await supabase.storage.from(bucketName).remove(files);
      if (removeError) {
        console.error(`Error removing files from root:`, removeError.message);
      }
    }
    
    for (const folder of folders) {
      await cleanFolder(bucketName, folder);
    }
    
    console.log(`Bucket "${bucketName}" cleanup complete!`);
  } catch (err) {
    console.error(`Unexpected error during bucket clean:`, err);
  }
}

async function cleanFolder(bucketName, folderPath) {
  try {
    let { data: items, error } = await supabase.storage.from(bucketName).list(folderPath, {
      limit: 100,
    });
    
    if (error) {
      console.error(`Error listing folder ${folderPath}:`, error.message);
      return;
    }
    
    if (!items || items.length === 0) return;
    
    const files = [];
    const folders = [];
    for (const item of items) {
      if (item.id === null) {
        folders.push(`${folderPath}/${item.name}`);
      } else {
        files.push(`${folderPath}/${item.name}`);
      }
    }
    
    if (files.length > 0) {
      console.log(`Removing files from folder "${folderPath}": ${files.join(', ')}`);
      const { error: removeError } = await supabase.storage.from(bucketName).remove(files);
      if (removeError) {
        console.error(`Error removing files from ${folderPath}:`, removeError.message);
      }
    }
    
    for (const folder of folders) {
      await cleanFolder(bucketName, folder);
    }
  } catch (err) {
    console.error(`Unexpected error cleaning folder ${folderPath}:`, err);
  }
}

async function main() {
  // 1. Clean storage bucket
  if (supabase) {
    await cleanBucket('event-media');
  }

  // 2. Clean and Seed Database
  console.log('Truncating database tables and seeding default user accounts...');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Clean existing database records
    await prisma.notification.deleteMany();
    await prisma.faceTag.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.media.deleteMany();
    await prisma.album.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✓ All existing database records deleted.');

    // Create default password hashes
    const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
    const photoPasswordHash = await bcrypt.hash('PhotoPassword123', 10);
    const memberPasswordHash = await bcrypt.hash('MemberPassword123', 10);
    const viewerPasswordHash = await bcrypt.hash('ViewerPassword123', 10);

    // Create seed users
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

    console.log('✓ Default users seeded:', {
      admin: admin.email,
      photographer: photographer.email,
      member: member.email,
      viewer: viewer.email,
    });

    console.log('Database and storage cleanup completed successfully!');
  } catch (err) {
    console.error('Error during database seed:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error in cleanup script:', e);
    process.exit(1);
  });
