import { NextResponse } from 'next/server';
import { userDb, agentDb, otpDb } from '@/lib/db';
import { sendOTPVerificationEmail } from '@/lib/email';
import { UserSchema } from '@/lib/schemas';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userId, type } = body; // type: 'user' | 'agent'

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let user = null;
    let isAgent = false;

    if (userId) {
      // Resend OTP for an existing account
      if (type === 'agent') {
        user = await agentDb.getById(userId);
        isAgent = true;
      } else {
        user = await userDb.getById(userId);
      }

      if (!user) {
        return NextResponse.json(
          { error: 'User/Agent not found' },
          { status: 404 }
        );
      }
    } else {
      // New signup — check for duplicate email first
      const existingUser = await userDb.getByEmail(email);
      const existingAgent = await agentDb.getByEmail(email);

      if (existingUser || existingAgent) {
        return NextResponse.json(
          { error: 'Email already exists. Please use a different email or login.' },
          { status: 400 }
        );
      }
    }

    if (!user) {
      if (type === 'agent') {
        return NextResponse.json(
          { error: 'Agent not found. Please sign up first.' },
          { status: 404 }
        );
      }

      // Create user during signup — validate input with Zod first
      if (body.name && body.phoneNumber && body.address) {
        const parsed = UserSchema.safeParse({
          name: body.name,
          email: body.email,
          phoneNumber: body.phoneNumber,
          address: body.address,
          password: body.password,
          role: 'user',
          verified: false,
        });

        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.format() },
            { status: 400 }
          );
        }

        let hashedPassword = null;
        if (parsed.data.password) {
          hashedPassword = await bcrypt.hash(parsed.data.password, 10);
        }

        user = await userDb.create({
          name: parsed.data.name,
          email: parsed.data.email,
          phoneNumber: parsed.data.phoneNumber,
          address: parsed.data.address,
          password: hashedPassword,
          role: 'user',
          verified: false,
        });
      } else {
        return NextResponse.json(
          { error: 'User not found. Please sign up first.' },
          { status: 404 }
        );
      }
    }

    // Delete any existing OTPs for this user/agent
    await otpDb.delete(user.id, 'registration');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await otpDb.create({
      userId: user.id,
      otp: hashedOtp,
      purpose: 'registration',
      email: user.email,
    });

    try {
      await sendOTPVerificationEmail({ userId: user.id, email: user.email, otp });
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError.message);

      if (process.env.NODE_ENV === 'development') {
        console.log('\n═══════════════════════════════════════');
        console.log('🔐 OTP FOR DEVELOPMENT (Email failed):');
        console.log(`   Email: ${user.email}`);
        console.log(`   OTP: ${otp}`);
        console.log('═══════════════════════════════════════\n');
      }

      return NextResponse.json(
        {
          error: 'Failed to send OTP email',
          message: emailError.message,
          ...(process.env.NODE_ENV === 'development' && {
            devOtp: otp,
            note: 'Email sending failed. Use the OTP above for testing in development mode.',
          }),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'PENDING',
      message: 'OTP sent to your email',
      userId: user.id,
      email: user.email,
      type: isAgent ? 'agent' : 'user',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
