'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const heroImageSrc =
    'https://drive.google.com/uc?export=view&id=1ymxH4XgaFJvy6MWoNpyTtiu_C9m2p6pg';
  const logoSrc =
    'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!form.address) {
      setError('Address is required');
      return;
    }

    setSubmitting(true);
    try {
      // Send OTP without creating account yet
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          phoneNumber: form.phoneNumber,
          address: form.address,
          password: form.password,
          type: 'user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      // Show OTP modal
      setOtpData({
        userId: data.userId,
        email: data.email,
        type: data.type,
        formData: form, // Store form data temporarily
      });
      setShowOtpModal(true);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifying(true);
    setOtpError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: otpData.userId,
          otp: otp,
          type: otpData.type,
        }),
      });

      const data = await response.json();

      console.log('OTP Verification Response:', { 
        ok: response.ok, 
        status: response.status, 
        data 
      });

      // Check if response is not ok
      if (!response.ok) {
        setOtpError(data.error || 'Invalid OTP. Signup cancelled.');
        setVerifying(false);
        // Account is already deleted by backend
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpData(null);
          setOtp('');
          router.push('/signup');
        }, 2000);
        return;
      }

      // Check if verification was successful - API returns success: true and status: 'VERIFIED'
      if (data.success === true && data.status === 'VERIFIED') {
        console.log('OTP verified successfully, preparing redirect...');
        
        // OTP verified successfully - save to localStorage
        localStorage.setItem('user', JSON.stringify({
          name: otpData.formData.name,
          email: otpData.formData.email,
          role: 'user',
        }));

        // Close modal first
        setShowOtpModal(false);
        setOtpData(null);
        setOtp('');
        setVerifying(false);
        
        // Show success message briefly then redirect
        alert('Email verified successfully! Account created.');
        
        // Use window.location for more reliable redirect
        console.log('Redirecting to /user page...');
        window.location.href = '/user';
      } else {
        // Verification failed
        console.error('OTP verification failed:', data);
        setOtpError(data.error || 'OTP verification failed. Please try again.');
        setVerifying(false);
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setOtpError('An error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setOtpError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#f0f4f8] flex items-center justify-center px-0">
      <div className="w-full h-screen bg-white md:rounded-none rounded-none shadow-none md:shadow-none border-none overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-screen">

          {/* LEFT SIDE */}
          <div className="bg-[#c7d3e3] flex flex-col items-center justify-center p-4 md:p-8 text-center h-full">
            <div className="relative w-full max-w-2xl aspect-square">
              <Image
                src={heroImageSrc}
                alt="Welcome Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col justify-center px-8 md:px-12 py-10 bg-[#f9fafb] h-full">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="h-48 w-48 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                <Image
                  src={logoSrc}
                  alt="Logo"
                  width={140}
                  height={140}
                  className="object-contain"
                />
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name"
                required
                value={form.name}
                onChange={handleChange('name')}
                className="input text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
                className="input text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={handleChange('email')}
                className="input bg-blue-50 input text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <input
                type="text"
                placeholder="Address"
                required
                value={form.address}
                onChange={handleChange('address')}
                className="input text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={handleChange('password')}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className="input text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5c6bc0] hover:bg-[#4c5ab0] text-white font-semibold py-3 rounded-md transition disabled:opacity-60"
                suppressHydrationWarning
              >
                {submitting ? 'Sending OTP...' : 'Sign Up'}
              </button>
            </form>

            {/* LINKS */}
            <div className="mt-6 text-sm text-center text-gray-600 space-y-2">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                  Login now
                </Link>
              </p>
              <p>
                <Link href="/agent-signup" className="text-blue-600 font-semibold hover:underline">
                  Sign up as agent
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 mb-4">
              We've sent a 6-digit OTP to <strong>{otpData?.email}</strong>
            </p>
            <p className="text-sm text-green-600 mb-6 bg-green-50 p-3 rounded">
              ✓ OTP sent to your email
            </p>

            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {otpError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpData(null);
                  setOtp('');
                  setOtpError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={verifying}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
                className="flex-1 px-4 py-2 bg-[#5c6bc0] text-white rounded-lg hover:bg-[#4c5ab0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable input styles */}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
