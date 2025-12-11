import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import bcrypt from 'bcrypt';

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

    // Find agent by email
    const agent = await agentDb.getByEmail(email);

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if agent is approved
    if (!agent.approved) {
      return NextResponse.json(
        { 
          error: 'Your account is pending approval. Please wait for admin approval before logging in.',
          pendingApproval: true 
        },
        { status: 403 }
      );
    }

    // Verify password
    if (!agent.password) {
      return NextResponse.json(
        { error: 'Password not set for this account. Please contact support.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, agent.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Login successful',
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: 'agent',
      },
    });
  } catch (error) {
    console.error('Agent login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

