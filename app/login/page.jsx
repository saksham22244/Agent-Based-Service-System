'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';

export default function LoginPage() {
  // ========== STATE VARIABLES ==========
  const router = useRouter();
  const [email, setEmail] = useState('');           // Email input value
  const [password, setPassword] = useState('');     // Password input value
  const [error, setError] = useState('');           // Error message display
  const [submitting, setSubmitting] = useState(false); // Loading state for button
  const [showRoleModal, setShowRoleModal] = useState(false); // Role selection popup
  const [googleData, setGoogleData] = useState(null); // Google user data from OAuth
  const [googleRole, setGoogleRole] = useState('user'); // Selected role (user/agent)

  // ========== IMAGE URLs ==========
  // Hero background image for left side
  const heroImageSrc = 'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  // Logo image for right side
  const logoSrc = 'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  // ========== EMAIL/PASSWORD LOGIN HANDLER ==========
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    setError('');
    setSubmitting(true);

    try {
      // Send credentials to backend API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user session data to browser localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        toast.success('Login successfully!');

        // Redirect after 1.5 seconds based on user role
        setTimeout(() => {
          if (data.user.role === 'admin' || data.user.role === 'superadmin') {
            router.push('/admin');  // Admin dashboard
          } else if (data.user.role === 'user') {
            router.push('/user');   // Regular user dashboard
          } else if (data.user.role === 'agent') {
            router.push('/agent');  // Agent dashboard
          } else {
            router.push('/user');   // Fallback
          }
        }, 1500);
      } else {
        // Handle agent pending approval case
        if (data.error === 'PENDING_APPROVAL') {
          router.push('/agent/pending-approval');
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

  // ========== GOOGLE OAUTH SUCCESS HANDLER ==========
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError('Google login failed, no credential received.');
        return;
      }

      // Send Google token to backend for verification
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'NEW_USER') {
          // First time user - show role selection modal
          setGoogleData(data.googleData);
          setShowRoleModal(true);
        } else {
          // Existing user - save session and redirect
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success('Login successfully!');

          setTimeout(() => {
            if (data.user.role === 'admin' || data.user.role === 'superadmin') router.push('/admin');
            else if (data.user.role === 'user') router.push('/user');
            else if (data.user.role === 'agent') router.push('/agent');
            else router.push('/user');
          }, 1500);
        }
      } else {
        // Handle agent pending approval
        if (data.error === 'PENDING_APPROVAL') {
          router.push('/agent/pending-approval');
        } else {
          setError(data.error || 'Google login failed');
        }
      }
    } catch (err) {
      setError('An error occurred during Google sign in.');
    }
  };

  // ========== COMPLETE GOOGLE SIGNUP WITH ROLE ==========
  const handleGoogleSignup = async () => {
    if (!googleData) return;
    setSubmitting(true);
    try {
      // Send Google data + selected role to backend
      const response = await fetch('/api/auth/google/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...googleData, role: googleRole }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/user');
      } else if (data.error === 'PENDING_APPROVAL' || data.status === 'PENDING_APPROVAL') {
        router.push('/agent/pending-approval');
      } else {
        setError(data.error || 'Failed to finish Google signup');
        setShowRoleModal(false);
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER LOGIN PAGE ==========
  return (
    // Google OAuth Provider wrapper - enables Google Sign-In
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '282906055180-u6ktve2ganpfjip6l9mjh4ftc2r09mk9.apps.googleusercontent.com'}>
      <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans">
        <div className="w-full h-screen bg-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">

            {/* ========== LEFT SIDE - HERO IMAGE ========== */}
            <div className="relative bg-[#c7d3e3]">
              <Image
                src={heroImageSrc}
                alt="Login Illustration"
                fill
                className="object-cover"
                priority
                sizes="50vw"
              />
              {/* Dark overlay for better text contrast if needed */}
              <div className="absolute inset-0 bg-black/5"></div>
            </div>

            {/* ========== RIGHT SIDE - LOGIN FORM ========== */}
            <div className="flex-col justify-center px-10 md:px-20 lg:px-28 py-12 bg-slate-50">

              {/* Logo Section - Circular container with brand logo */}
              <div className="flex justify-center mb-6">
                <div className="h-40 w-40 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-4 ring-slate-50 transition-all duration-300">
                  <Image
                    src={logoSrc}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Page Heading */}
              <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight mb-8">
                Sign in to your account
              </h2>

              {/* Error Message Display */}
              {error && (
                <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg shadow-sm">
                  {error}
                </div>
              )}

              {/* Email/Password Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input Field */}
                <div className="space-y-1">
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:border-blue-500 focus:outline-none"
                    suppressHydrationWarning
                  />
                </div>

                {/* Password Input Field */}
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:border-blue-500 focus:outline-none"
                    suppressHydrationWarning
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-200 disabled:opacity-60 disabled:shadow-none"
                  suppressHydrationWarning
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* OR Divider */}
              <div className="my-8 flex items-center justify-center">
                <div className="flex-grow h-px bg-slate-200"></div>
                <span className="px-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">Or continue with</span>
                <div className="flex-grow h-px bg-slate-200"></div>
              </div>

              {/* Google Sign-In Button */}
              <div className="flex justify-center flex-col items-center gap-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  shape="rectangular"
                  size="large"
                  theme="outline"
                />
                <p className="text-xs text-slate-400 mt-3 font-medium">Sign in works for user and Agents</p>
              </div>

              {/* Sign Up Links */}
              <div className="mt-8 text-sm text-center text-slate-500 space-y-3">
                <p>
                  Don&apos;t have an account?{' '}
                  <Link href="/user/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline decoration-indigo-200 underline-offset-4 transition-all">
                    Sign up as user
                  </Link>
                </p>
                <p>
                  <Link href="/agent/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline decoration-indigo-200 underline-offset-4 transition-all">
                    Sign up as agent
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ROLE SELECTION MODAL (For New Google Users) ========== */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center border border-slate-100">
              
              {/* Modal Heading */}
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Complete your Profile</h2>
              
              {/* Welcome Message */}
              <p className="text-sm text-slate-500 mb-8 font-medium">
                Welcome {googleData?.name?.split(' ')[0]}! Are you signing up as a regular User or an Agent?
              </p>
              
              {/* Role Selection Buttons */}
              <div className="flex flex-col gap-4 mb-8">
                {/* User Role Button */}
                <button
                  onClick={() => setGoogleRole('user')}
                  className={`py-4 rounded-xl border-2 transition-all duration-200 ${googleRole === 'user' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <strong className="block text-lg font-bold mb-1">User</strong>
                  <span className="text-xs font-medium opacity-80">Access everyday services</span>
                </button>
                
                {/* Agent Role Button */}
                <button
                  onClick={() => setGoogleRole('agent')}
                  className={`py-4 rounded-xl border-2 transition-all duration-200 ${googleRole === 'agent' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <strong className="block text-lg font-bold mb-1">Agent</strong>
                  <span className="text-xs font-medium opacity-80">Provide services (Requires Approval)</span>
                </button>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-200 disabled:opacity-60 disabled:shadow-none mb-4"
              >
                {submitting ? 'Setting up...' : 'Continue'}
              </button>
              
              {/* Cancel Button */}
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}