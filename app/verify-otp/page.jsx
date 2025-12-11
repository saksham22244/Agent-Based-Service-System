'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('user'); // 'user' or 'agent'

  useEffect(() => {
    const userIdParam = searchParams?.get('userId');
    const emailParam = searchParams?.get('email');
    const typeParam = searchParams?.get('type') || 'user';
    
    if (userIdParam && emailParam) {
      setUserId(userIdParam);
      setEmail(emailParam);
      setType(typeParam);
    } else {
      setError('Missing user information. Please sign up again.');
    }
  }, [searchParams]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, ''); // Only numbers
    
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
    if (pastedData.length === 4) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-3')?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      setError('Please enter the complete OTP');
      return;
    }

    if (!userId) {
      setError('User ID is missing. Please sign up again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otp: otpString,
          type, // Pass type to API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // For agents, don't auto-login (they need approval)
        if (data.type === 'agent' || !data.autoLogin) {
          router.push('/login?verified=success&type=agent&message=Your account is pending admin approval');
          return;
        }

        // For users, auto-login
        if (data.autoLogin) {
          try {
            const loginResponse = await fetch('/api/admin/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.user.email,
                password: 'auto-login', // Temporary, will be handled by auth.login
              }),
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
              // Store user in session/localStorage for now
              if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(loginData.user));
              }
              // Redirect based on user role/email
              if (loginData.user.email === 'admin@example.com' || loginData.user.role === 'superadmin') {
                router.push('/dashboard');
              } else {
                router.push('/user');
              }
            } else {
              // If auto-login fails, redirect to login page
              router.push('/login?verified=success');
            }
          } catch (loginError) {
            console.error('Auto-login error:', loginError);
            router.push('/login?verified=success');
          }
        } else {
          router.push('/login?verified=success');
        }
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId || !email) {
      setError('Missing user information');
      return;
    }

    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          type, // Pass type when resending
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        alert('OTP has been resent to your email');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Missing user information</p>
          <a href="/signup" className="text-blue-600 hover:text-blue-500">
            Go back to signup
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 4-digit OTP to <strong>{email}</strong>
          </p>
          {type === 'agent' && (
            <p className="mt-2 text-center text-xs text-yellow-600">
              Note: After verification, your agent account will need admin approval before you can log in.
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 4}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the OTP?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

