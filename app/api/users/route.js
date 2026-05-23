import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { UserSchema } from '@/lib/schemas';
import { sendAccountCreatedEmail } from '@/lib/email';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

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
  // Admin-only: create a user directly (bypasses OTP flow)
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Validate and strip unknown fields
    const parsed = UserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phoneNumber, address, password, verified } = parsed.data;

    // Check for duplicate email
    const existingUser = await userDb.getByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const generatedPassword = password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = await userDb.create({
      name,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
      role: 'user',
      // Admin-created users are verified by default unless explicitly set
      verified: verified !== undefined ? verified : true,
    });

    try {
      await sendAccountCreatedEmail({
        email: newUser.email,
        name: newUser.name,
        password: generatedPassword,
        role: 'user',
      });
    } catch (emailError) {
      console.error('Error sending new user email:', emailError);
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
