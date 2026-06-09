import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET: Fetches events with search, sorting, and role-based privacy filters.
 */
export async function GET(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role') || 'VIEWER';
    const userClub = request.headers.get('x-user-club') || '';

    // Extract search, category, and sort parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'date'; // 'date', 'name', 'category'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'

    // Define visibility filter based on user roles and club membership
    let privacyFilter: any = {};

    if (userRole === 'ADMIN' || userRole === 'PHOTOGRAPHER') {
      // Admins and Photographers can see all events
      privacyFilter = {};
    } else if (userRole === 'CLUB_MEMBER' && userClub) {
      // Club Members see all public events + private events from their club
      privacyFilter = {
        OR: [
          { isPrivate: false },
          { 
            AND: [
              { isPrivate: true },
              { clubName: userClub }
            ]
          }
        ]
      };
    } else {
      // Viewers and anyone else see public events only
      privacyFilter = { isPrivate: false };
    }

    // Build the query where clause
    const whereClause: any = {
      ...privacyFilter,
      AND: []
    };

    if (search) {
      whereClause.AND.push({
        name: { contains: search, mode: 'insensitive' }
      });
    }

    if (category) {
      whereClause.AND.push({
        category: category
      });
    }

    // Clean up empty AND array
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    // Validate sorting
    const allowedSortFields = ['date', 'name', 'category'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const events = await db.event.findMany({
      where: whereClause,
      include: {
        albums: {
          select: { id: true, name: true },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { media: true, albums: true }
        }
      },
      orderBy: {
        [orderByField]: orderDirection
      }
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching events.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Creates a new event. Authorized for ADMIN and PHOTOGRAPHER.
 */
export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userClub = request.headers.get('x-user-club');

    if (userRole !== 'ADMIN' && userRole !== 'PHOTOGRAPHER') {
      return NextResponse.json(
        { error: 'Forbidden. Photographer or Admin role required.' },
        { status: 403 }
      );
    }

    const { name, description, category, date, location, isPrivate, clubName, coverImage } = await request.json();

    if (!name || !category || !date) {
      return NextResponse.json(
        { error: 'Event name, category, and date are required.' },
        { status: 400 }
      );
    }

    const finalClubName = clubName ? clubName.trim() : null;

    const newEvent = await db.event.create({
      data: {
        name,
        description,
        category: category.toLowerCase().trim(),
        date: new Date(date),
        location: location || null,
        isPrivate: !!isPrivate,
        clubName: finalClubName,
        coverImage: coverImage || null,
      }
    });

    return NextResponse.json({
      message: 'Event created successfully',
      event: newEvent
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error creating event.' },
      { status: 500 }
    );
  }
}
