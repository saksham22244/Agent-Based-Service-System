import { NextResponse } from 'next/server';
import { userDb, agentDb, otpDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, otp, type } = body; // type can be 'user' or 'agent'

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP are required' },
        { status: 400 }
      );
    }

    // Find the OTP record
    const otpRecord = await otpDb.findByUserId(userId, 'registration');

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    let updatedUser;
    let autoLogin = false;

    // Handle verification based on type
    if (type === 'agent') {
      // For agents, we don't set verified, they just need OTP verification
      // Agents still need admin approval to login
      updatedUser = await agentDb.getById(userId);
      // Don't auto-login agents, they need approval
      autoLogin = false;
    } else {
      // For users, verify them and allow auto-login
      updatedUser = await userDb.update(userId, { verified: true });
      autoLogin = true;
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User/Agent not found' },
        { status: 404 }
      );
    }

    // Delete the used OTP
    await otpDb.delete(userId, 'registration');

    return NextResponse.json({
      status: 'VERIFIED',
      message: type === 'agent' 
        ? 'Email verified successfully. Your account is pending admin approval.' 
        : 'Email verified successfully',
      user: updatedUser,
      type: type || 'user',
      autoLogin, // Only true for users, false for agents
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

