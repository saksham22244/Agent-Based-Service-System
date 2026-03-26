import { NextResponse } from 'next/server';
import { userDb, agentDb, otpDb } from '@/lib/db';
import { sendOTPVerificationEmail } from '@/lib/email';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userId, type } = body; // type can be 'user' or 'agent'

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let user = null;
    let isAgent = false;

    // If userId is provided, check if it's a user or agent (for existing accounts)
    if (userId) {
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
      // If no userId, check if email already exists (for new signups)
      const existingUser = await userDb.getByEmail(email);
      const existingAgent = await agentDb.getByEmail(email);
      
      if (existingUser || existingAgent) {
        return NextResponse.json(
          { error: 'Email already exists. Please use a different email or login.' },
          { status: 400 }
        );
      }
    }

    // If user doesn't exist, create based on type
    if (!user) {
      if (type === 'agent') {
        // Agent should already be created before sending OTP
        return NextResponse.json(
          { error: 'Agent not found. Please sign up first.' },
          { status: 404 }
        );
      } else {
        // Check if this is during signup (user data might be in request)
        if (body.name && body.phoneNumber && body.address) {
          // Hash password if provided
          let hashedPassword = null;
          if (body.password) {
            hashedPassword = await bcrypt.hash(body.password, 10);
          }
          
          user = await userDb.create({
            name: body.name,
            email: body.email,
            phoneNumber: body.phoneNumber,
            address: body.address,
            password: hashedPassword,
            role: 'user',
            verified: false, // Mark as unverified - will be verified after OTP
          });
        } else {
          return NextResponse.json(
            { error: 'User not found. Please sign up first.' },
            { status: 404 }
          );
        }
      }
    }

    // Delete any existing OTPs for this user/agent
    await otpDb.delete(user.id, 'registration');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save OTP to database
    await otpDb.create({
      userId: user.id,
      otp: hashedOtp,
      purpose: 'registration',
      email: user.email,
    });

    // Send OTP email (this will use the actual OTP, not hashed)
    try {
      await sendOTPVerificationEmail({ userId: user.id, email: user.email, otp });
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError.message);
      
      // In development, log the OTP to console as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('\n═══════════════════════════════════════');
        console.log('🔐 OTP FOR DEVELOPMENT (Email failed):');
        console.log(`   Email: ${user.email}`);
        console.log(`   OTP: ${otp}`);
        console.log('═══════════════════════════════════════\n');
      }
      
      // Return error response so user knows email failed
      return NextResponse.json(
        { 
          error: 'Failed to send OTP email',
          message: emailError.message,
          // In development, include OTP in response for testing
          ...(process.env.NODE_ENV === 'development' && { 
            devOtp: otp,
            note: 'Email sending failed. Use the OTP above for testing in development mode.'
          })
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

