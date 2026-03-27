'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [googleRole, setGoogleRole] = useState('user'); // default selection

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
        
        toast.success('Login successfully!');
        
        // Check user role and redirect accordingly
        if (data.user.role === 'admin' || data.user.role === 'superadmin') {
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
         setError('Google login failed, no credential received.');
         return;
      }
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'NEW_USER') {
          // Open role selector modal
          setGoogleData(data.googleData);
          setShowRoleModal(true);
        } else {
          // Success login
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success('Login successfully!');
          if (data.user.role === 'admin' || data.user.role === 'superadmin') router.push('/dashboard');
          else if (data.user.role === 'user') router.push('/user');
          else if (data.user.role === 'agent') router.push('/agent');
          else router.push('/user');
        }
      } else {
        if (data.error === 'PENDING_APPROVAL') {
          router.push('/pending-approval');
        } else {
          setError(data.error || 'Google login failed');
        }
      }
    } catch (err) {
      setError('An error occurred during Google sign in.');
    }
  };

  const handleGoogleSignup = async () => {
    if (!googleData) return;
    setSubmitting(true);
    try {
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
        router.push('/pending-approval');
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

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '282906055180-u6ktve2ganpfjip6l9mjh4ftc2r09mk9.apps.googleusercontent.com'}>
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
                suppressHydrationWarning
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input bg-blue-50 text-gray-900 placeholder-gray-500"
                suppressHydrationWarning
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5c6bc0] hover:bg-[#4c5ab0] text-white font-semibold py-3 rounded-md transition disabled:opacity-60"
                suppressHydrationWarning
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center justify-center">
              <div className="w-full h-px bg-gray-300"></div>
              <span className="px-3 text-sm text-gray-500 font-medium">OR</span>
              <div className="w-full h-px bg-gray-300"></div>
            </div>

            <div className="flex justify-center flex-col items-center gap-2">
               <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
               />
               <p className="text-xs text-gray-500 mt-2">Sign in works for both Users and Agents</p>
            </div>

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

      {/* Role Selection Modal for New Google Sign In */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
             <h2 className="text-xl font-bold text-gray-900 mb-2">Complete your Profile</h2>
             <p className="text-sm text-gray-600 mb-6">
                Welcome {googleData?.name?.split(' ')[0]}! Are you signing up as a regular User or an Agent?
             </p>
             <div className="flex flex-col gap-3 mb-6">
               <button 
                  onClick={() => setGoogleRole('user')}
                  className={`py-3 rounded-lg border-2 transition-all ${googleRole === 'user' ? 'border-[#5c6bc0] bg-blue-50 text-[#5c6bc0]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
               >
                 <strong className="block text-lg">User</strong>
                 <span className="text-xs">Access everyday services</span>
               </button>
               <button 
                  onClick={() => setGoogleRole('agent')}
                  className={`py-3 rounded-lg border-2 transition-all ${googleRole === 'agent' ? 'border-[#5c6bc0] bg-blue-50 text-[#5c6bc0]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
               >
                 <strong className="block text-lg">Agent</strong>
                 <span className="text-xs">Provide services (Requires Approval)</span>
               </button>
             </div>
             
             <button 
                onClick={handleGoogleSignup}
                disabled={submitting}
                className="w-full bg-[#5c6bc0] text-white font-semibold py-3 rounded-lg hover:bg-[#4c5ab0] transition-colors disabled:opacity-50"
             >
                {submitting ? 'Setting up...' : 'Continue'}
             </button>
             <button 
                onClick={() => setShowRoleModal(false)}
                className="mt-3 text-sm text-gray-500 hover:underline"
             >
                Cancel
             </button>
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
    </GoogleOAuthProvider>
  );
}