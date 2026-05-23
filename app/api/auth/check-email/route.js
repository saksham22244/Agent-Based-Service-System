import { NextResponse } from 'next/server';
import { userDb, agentDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const existingUser = await userDb.getByEmail(email);
    const existingAgent = await agentDb.getByEmail(email);

    if (existingUser || existingAgent) {
      return NextResponse.json(
        {
          exists: true,
          error: 'Email already exists. Please use a different email or login.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to validate email' },
      { status: 500 }
    );
  }
}
