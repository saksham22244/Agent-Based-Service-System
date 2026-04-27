import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const session = await auth.login(email, password);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Agent pending check
    if (session.isAgent && !session.user.approved) {
      return NextResponse.json(
        { error: 'PENDING_APPROVAL' },
        { status: 403 }
      );
    }

    // Check if user is verified (for regular users)
    if (session.user.role === 'user' && !session.user.verified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 }
      );
    }

    // If match then login successfully
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: session.user._id, email: session.user.email, role: session.user.role },
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
      { expiresIn: '1d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      user: session.user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
