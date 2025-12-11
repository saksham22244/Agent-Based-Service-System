import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';

export async function GET() {
  try {
    const users = await userDb.getAll();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.phoneNumber || !body.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prevent admin from signing up
    if (body.email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Admin account cannot be created through signup. Please use the admin login.' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await userDb.getByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const newUser = await userDb.create({
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      address: body.address,
      role: body.role || 'user',
      verified: false, // User needs to verify email
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
