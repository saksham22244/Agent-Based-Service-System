import { NextResponse } from 'next/server';
import { userDb, agentDb, otpDb } from '@/lib/db';
import bcrypt from 'bcrypt';
import { createToken } from '@/lib/auth';

const RETRY_LIMIT = otpDb.RETRY_LIMIT; // 3

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, otp, type } = body; // type: 'user' | 'agent'

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP are required' },
        { status: 400 }
      );
    }

    // Verify the account exists
    let existingUser = null;
    if (type === 'agent') {
      existingUser = await agentDb.getById(userId);
    } else {
      existingUser = await userDb.getById(userId);
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User/Agent not found. Please sign up again.' },
        { status: 404 }
      );
    }

    // Find the current OTP record (must be non-expired)
    const otpRecord = await otpDb.findByUserId(userId, 'registration');

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify the submitted OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      // Atomically increment the attempts counter
      const updatedOtp = await otpDb.incrementAttempts(userId, 'registration');

      if (!updatedOtp) {
        // OTP expired between the findByUserId and incrementAttempts calls
        return NextResponse.json(
          { error: 'OTP not found or expired. Please request a new OTP.' },
          { status: 400 }
        );
      }

      const attemptsUsed = updatedOtp.attempts;
      const remaining = RETRY_LIMIT - attemptsUsed;

      if (remaining > 0) {
        // Still have attempts left — do NOT delete the account
        return NextResponse.json(
          { error: `Invalid OTP. ${remaining} attempt(s) remaining.` },
          { status: 400 }
        );
      }

      // Retry limit reached — cancel signup
      await otpDb.delete(userId, 'registration');

      if (type === 'user') {
        await userDb.delete(userId).catch(err =>
          console.error('Error deleting user after OTP exhaustion:', err)
        );
      } else if (type === 'agent') {
        await agentDb.delete(userId).catch(err =>
          console.error('Error deleting agent after OTP exhaustion:', err)
        );
      }

      return NextResponse.json(
        { error: 'Maximum OTP attempts exceeded. Signup cancelled.' },
        { status: 400 }
      );
    }

    // OTP is correct — verify the account
    let updatedUser;
    let autoLogin = false;

    if (type === 'agent') {
      // Agents need admin approval before they can log in
      updatedUser = await agentDb.getById(userId);
      autoLogin = false;
    } else {
      updatedUser = await userDb.update(userId, { verified: true });
      autoLogin = true;
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User/Agent not found' },
        { status: 404 }
      );
    }

    // Clean up the used OTP
    await otpDb.delete(userId, 'registration');

    let token;
    if (autoLogin) {
      token = createToken({
        id: updatedUser.id || updatedUser._id,
        email: updatedUser.email,
        role: 'user',
      });
    }

    return NextResponse.json({
      status: 'VERIFIED',
      message:
        type === 'agent'
          ? 'Email verified successfully. Your account is pending admin approval.'
          : 'Email verified successfully',
      user: updatedUser,
      type: type || 'user',
      autoLogin,
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
