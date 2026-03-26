'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AgentSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
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
    'https://drive.google.com/uc?export=view&id=1ymxH4XgaFJvy6MWoNpyTtiu_C9m2p6pg';
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
          router.push('/agent-signup');
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
    <div className="min-h-screen w-full bg-[#f0f4f8] flex items-center justify-center px-0">
      <div className="w-full h-screen bg-white md:rounded-none shadow-none overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-screen">

          {/* LEFT SIDE */}
          <div className="bg-[#c7d3e3] flex flex-col items-center justify-center p-4 md:p-8 text-center h-full">
            <div className="relative w-full max-w-2xl aspect-square">
              <Image
                src={heroImageSrc}
                alt="Agent Based Service Illustration"
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

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input text-gray-900 placeholder-gray-500"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input text-gray-900 placeholder-gray-500"
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
              />

              <input
                type="text"
                placeholder="Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input text-gray-900 placeholder-gray-500"
              />

              <input
                type="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
              />

               <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 text-left">
                  Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePhotoChange}
                  className="input text-gray-900 placeholder-gray-500"
                />
                {photoPreview && (
                  <div className="mt-2 flex justify-start">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5c6bc0] hover:bg-[#4c5ab0] text-white font-semibold py-3 rounded-md transition disabled:opacity-60"
              >
                {loading ? 'Signing up...' : 'Sign Up as Agent'}
              </button>
            </form>

            {/* LINKS */}
            <div className="mt-6 text-sm text-center text-gray-600 space-y-2">
              <p>
                Already have an account?{' '}
                <a href="/login" className="text-blue-600 font-semibold hover:underline">
                  Login now
                </a>
              </p>
              <p>
                <a href="/signup" className="text-blue-600 font-semibold hover:underline">
                  Sign up as user
                </a>
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

