import { NextResponse } from 'next/server';
import { userDb, agentDb } from '@/lib/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, name, picture, role } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Double check it doesn't exist
    let existingUser = await userDb.getByEmail(email);
    if (!existingUser) existingUser = await agentDb.getByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Generate a random long strong password since they use Google Login
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    let newUser;
    let collection;

    if (role === 'user') {
      newUser = {
        name,
        email,
        password: hashedPassword, // Store random to prevent manual login without password setup
        phoneNumber: 'N/A', // Let them edit this later via profile
        address: 'N/A',
        role: 'user',
        verified: true, // Auto verify since google auth check passed
        picture: picture || null
      };

      const user = await userDb.create(newUser);

      return NextResponse.json({
        message: 'Signup successful',
        status: 'SUCCESS',
        user: { ...user, role: 'user' },
        token: 'google-auth-token-' + Date.now(),
      });
    } else if (role === 'agent') {
      newUser = {
        name,
        email,
        password: hashedPassword,
        phoneNumber: 'N/A',
        address: 'N/A',
        services: [], // Empty initially
        approved: false, // Agents must be approved by admin
        picture: picture || null
      };

      await agentDb.create(newUser);

      return NextResponse.json({
         status: 'PENDING_APPROVAL',
         message: 'Agent created successfully. Pending administrator approval.',
         error: 'PENDING_APPROVAL' 
      }, { status: 403 });

    } else {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

  } catch (error) {
    console.error('Google Signup Error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
