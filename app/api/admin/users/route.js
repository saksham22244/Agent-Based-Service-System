import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import bcrypt from 'bcrypt';

/**
 * GET /api/admin/users
 * Get all users with optional filtering and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let users = await userDb.getAll();
    
    // Filter out super admin
    users = users.filter(u => u.email !== 'admin@example.com');

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phoneNumber?.includes(search)
      );
    }

    // Apply verified filter
    if (verified !== null && verified !== undefined) {
      const isVerified = verified === 'true';
      users = users.filter(u => (u.verified !== false) === isVerified);
    }

    // Get total count before pagination
    const total = users.length;

    // Apply pagination
    const paginatedUsers = users.slice(skip, skip + limit);

    // Remove sensitive data
    const sanitizedUsers = paginatedUsers.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin can create users directly)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    const { name, email, phoneNumber, address, password, role, verified } = body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phoneNumber, address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await userDb.getByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = await userDb.create({
      name,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
      role: role || 'user',
      verified: verified !== undefined ? verified : true, // Admin-created users are verified by default
    });

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
