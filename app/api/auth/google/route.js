import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { userDb, agentDb } from '@/lib/db';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 400 });
    }

    const { email, name, picture } = payload;

    // Check if user already exists
    let user = await userDb.getByEmail(email);
    let isAgent = false;

    if (!user) {
      user = await agentDb.getByEmail(email);
      if (user) {
        isAgent = true;
        user.role = 'agent';
      }
    }

    // If user exists, log them in
    if (user) {
      if (isAgent && !user.approved) {
        return NextResponse.json({ error: 'PENDING_APPROVAL' }, { status: 403 });
      }

      if (user.role === 'user' && !user.verified) {
         // Auto verify if they sign in with google but weren't verified
         await userDb.update(user.id, { verified: true });
         user.verified = true;
      }

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role || 'user' },
        process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        status: 'SUCCESS',
        message: 'Login successful',
        user,
        token,
      });
    }

    // If user doesn't exist, prompt for signup
    return NextResponse.json({
      status: 'NEW_USER',
      message: 'User not found. Please select a role to sign up.',
      googleData: {
        email,
        name,
        picture
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
