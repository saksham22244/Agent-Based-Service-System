'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Replace with your new image URL
  const heroImageSrc = 'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  
  // Keep the logo if you want, or replace it too
  const logoSrc = 'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Check user role and redirect accordingly
        if (data.user.role === 'admin') {
          router.push('/dashboard');  // Admin goes to dashboard
        } else if (data.user.role === 'user') {
          router.push('/user');  // Regular user goes to /user
        } else if (data.user.role === 'agent') {
          router.push('/agent');  // Agent goes to /agent
        } else {
          // Default fallback
          router.push('/user');
        }
      } else {
        if (data.error === 'PENDING_APPROVAL') {
          router.push('/pending-approval');
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f0f4f8] flex items-center justify-center px-0">
      <div className="w-full h-screen bg-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">

          {/* LEFT SIDE - Image fills entire box */}
          <div className="relative bg-[#c7d3e3]">
            <Image
              src={heroImageSrc}
              alt="Login Illustration"
              fill
              className="object-cover"  // Changed from object-contain to object-cover
              priority
              sizes="50vw"
            />
            {/* Optional overlay if image is too bright */}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>

          {/* RIGHT SIDE - Everything remains exactly the same */}
          <div className="flex flex-col justify-center px-8 md:px-12 py-10 bg-[#f9fafb]">

            {/* Logo - You can also update this if needed */}
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

            {/* Heading */}
            <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">
              Sign in to your account
            </h2>

            {/* ERROR */}
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5c6bc0] hover:bg-[#4c5ab0] text-white font-semibold py-3 rounded-md transition disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* LINKS */}
            <div className="mt-6 text-sm text-center text-gray-600 space-y-2">
              <p>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                  Sign up as user
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