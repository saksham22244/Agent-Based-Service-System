'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AgentSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    paymentDetails: '',
    password: '',
    photo: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const heroImageSrc =
    'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  const logoSrc =
    'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

      if (!response.ok || !data.success) {
        setOtpError(data.error || 'Invalid OTP. Signup cancelled.');
        // Account is already deleted by backend
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpData(null);
          setOtp('');
          router.push('/agent/signup');
        }, 2000);
        return;
      }

      // OTP verified successfully - save to localStorage
      localStorage.setItem('user', JSON.stringify({
        name: formData.name,
        email: formData.email,
        role: 'agent',
      }));

      // Show success message
      alert('Email verified successfully! Your account is pending admin approval.');

      // Redirect to login page (agent needs admin approval)
      router.push('/login');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prevent admin from signing up as agent
      if (formData.email === 'admin@example.com') {
        setError('Admin account cannot be created through agent signup. Please use the admin login.');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.password || formData.password.length < 6) {
        setError('Password is required and must be at least 6 characters long');
        setLoading(false);
        return;
      }

      if (!formData.photo) {
        setError('Photo is required');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('paymentDetails', formData.paymentDetails);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('photo', formData.photo);

      // Create the agent
      const agentResponse = await fetch('/api/agents', {
        method: 'POST',
        body: formDataToSend,
      });

      const agentData = await agentResponse.json();

      if (!agentResponse.ok) {
        setError(agentData.error || 'Agent signup failed');
        return;
      }

      // Send OTP for email verification
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: agentData.id,
          email: formData.email,
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          type: 'agent', // Specify this is an agent
        }),
      });

      const otpResponseData = await otpResponse.json();

      if (otpResponse.ok) {
        // Show OTP modal instead of redirecting
        setOtpData({
          userId: agentData.id,
          email: formData.email,
          type: 'agent',
        });
        setShowOtpModal(true);
      } else {
        setError(otpResponseData.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans">
      <div className="w-full h-screen bg-white overflow-y-auto md:overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-full min-h-screen">

          {/* LEFT SIDE - Image fills entire box */}
          <div className="relative bg-[#c7d3e3] hidden md:block">
            <Image
              src={heroImageSrc}
              alt="Agent Based Service Illustration"
              fill
              className="object-cover"
              priority
              sizes="50vw"
            />
            {/* Optional overlay if image is too bright */}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white overflow-y-auto">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-4 ring-slate-50 transition-all duration-300">
                <Image
                  src={logoSrc}
                  alt="Logo"
                  width={90}
                  height={90}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight mb-8">
              Apply as Agent
            </h2>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg shadow-sm">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <input
                type="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <input
                type="text"
                placeholder="Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <input
                type="text"
                placeholder="Payment Details (eSewa info)"
                required
                value={formData.paymentDetails}
                onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <input
                type="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />

              <div className="space-y-1.5 pt-1">
                <label className="block text-sm font-semibold text-slate-600 text-left ml-1">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePhotoChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  suppressHydrationWarning
                />
                {photoPreview && (
                  <div className="mt-3 flex justify-start pl-1">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-200 disabled:opacity-60 disabled:shadow-none mt-2"
                suppressHydrationWarning
              >
                {loading ? 'Signing up...' : 'Sign Up as Agent'}
              </button>
            </form>

            <div className="my-8 flex items-center justify-center">
              <div className="flex-grow h-px bg-slate-200"></div>
              <span className="px-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">Or</span>
              <div className="flex-grow h-px bg-slate-200"></div>
            </div>

            {/* LINKS */}
            <div className="mt-2 text-sm text-center text-slate-500 space-y-3">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline decoration-indigo-200 underline-offset-4 transition-all">
                  Login now
                </Link>
              </p>
              <p>
                <Link href="/user/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline decoration-indigo-200 underline-offset-4 transition-all">
                  Sign up as user
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Verify Your Email</h2>
            <p className="text-sm text-slate-500 mb-4 font-medium">
              We've sent a 6-digit OTP to <strong className="text-slate-700">{otpData?.email}</strong>
            </p>
            <p className="text-xs text-emerald-600 mb-6 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg font-medium inline-block flex items-center justify-center gap-1.5 mx-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              OTP sent to your email
            </p>

            {otpError && (
              <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg shadow-sm text-left">
                {otpError}
              </div>
            )}

            <div className="mb-8 text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out text-slate-800 bg-slate-50"
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
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
                disabled={verifying}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-200 disabled:opacity-60 disabled:shadow-none"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}