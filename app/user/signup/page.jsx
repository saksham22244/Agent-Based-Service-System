'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';

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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({
    name: false,
    phoneNumber: false,
    email: false,
    address: false,
    password: false,
    confirmPassword: false,
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const checkEmailAvailability = async (email) => {
    if (!email || validateField('email', email)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.exists) {
        setErrors((prev) => ({ ...prev, email: data.error }));
      }
    } catch (err) {
      console.error('Email validation error:', err);
    }
  };
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const heroImageSrc =
    'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  const logoSrc =
    'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    const phoneDigits = form.phoneNumber.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!form.address.trim() || form.address.trim().length < 6) {
      newErrors.address = 'Address should be at least 6 characters';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else {
      if (form.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
        newErrors.password = 'Password must include letters and numbers';
      }
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        return '';
      case 'phoneNumber': {
        const phoneDigits = value.replace(/\D/g, '');
        if (!phoneDigits || phoneDigits.length !== 10) return 'Phone number must be 10 digits';
        return '';
      }
      case 'email':
        if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
        return '';
      case 'address':
        if (!value.trim() || value.trim().length < 6) return 'Address should be at least 6 characters';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must include letters and numbers';
        return '';
      case 'confirmPassword':
        if (value !== form.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');

    if (touched[field] || hasSubmitted) {
      const fieldError = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));

      if (field === 'password' || field === 'confirmPassword') {
        const confirmError = validateField('confirmPassword', field === 'confirmPassword' ? value : form.confirmPassword);
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setTouched({
      name: true,
      phoneNumber: true,
      email: true,
      address: true,
      password: true,
      confirmPassword: true,
    });
    setError('');

    if (
      !form.name.trim() &&
      !form.phoneNumber.trim() &&
      !form.email.trim() &&
      !form.address.trim() &&
      !form.password &&
      !form.confirmPassword
    ) {
      setError('Please fill out the form first');
      setErrors({});
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

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
        const duplicateEmail = data.error?.toLowerCase().includes('email already exists');
        if (duplicateEmail) {
          setErrors((prev) => ({ ...prev, email: data.error }));
          return;
        }
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
          router.push('/user/signup');
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
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        // Close modal first
        setShowOtpModal(false);
        setOtpData(null);
        setOtp('');
        setVerifying(false);

        // Show success message briefly then redirect
        toast.success('Email verified successfully! Account created.');

        // Use window.location for more reliable redirect
        console.log('Redirecting to /user page...');
        setTimeout(() => {
          window.location.href = '/user';
        }, 1500);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans">
      <div className="w-full h-screen bg-white overflow-y-auto md:overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-full min-h-screen">

          {/* LEFT SIDE - Image fills entire box */}
          <div className="relative bg-[#c7d3e3] hidden md:block">
            <Image
              src={heroImageSrc}
              alt="Welcome Illustration"
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
              Create your account
            </h2>

            {/* FORM */}
            <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg shadow-sm">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  const fieldError = validateField('name', form.name);
                  setErrors((prev) => ({ ...prev, name: fieldError }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.name) && errors.name && (
                <p className="text-sm text-red-600 mt-2">{errors.name}</p>
              )}

              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, phoneNumber: true }));
                  const fieldError = validateField('phoneNumber', form.phoneNumber);
                  setErrors((prev) => ({ ...prev, phoneNumber: fieldError }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.phoneNumber) && errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-2">{errors.phoneNumber}</p>
              )}

              <input
                type="email"
                name="signup-email"
                autoComplete="off"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={async () => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  const fieldError = validateField('email', form.email);
                  setErrors((prev) => ({ ...prev, email: fieldError }));
                  if (!fieldError) {
                    await checkEmailAvailability(form.email);
                  }
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.email) && errors.email && (
                <p className="text-sm text-red-600 mt-2">{errors.email}</p>
              )}

              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={handleChange('address')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, address: true }));
                  const fieldError = validateField('address', form.address);
                  setErrors((prev) => ({ ...prev, address: fieldError }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.address) && errors.address && (
                <p className="text-sm text-red-600 mt-2">{errors.address}</p>
              )}

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }));
                  const fieldError = validateField('password', form.password);
                  const confirmError = validateField('confirmPassword', form.confirmPassword);
                  setErrors((prev) => ({ ...prev, password: fieldError, confirmPassword: confirmError }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.password) && errors.password && (
                <p className="text-sm text-red-600 mt-2">{errors.password}</p>
              )}

              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  const fieldError = validateField('confirmPassword', form.confirmPassword);
                  setErrors((prev) => ({ ...prev, confirmPassword: fieldError }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/10 transition-all duration-200 ease-in-out"
                suppressHydrationWarning
              />
              {(hasSubmitted || touched.confirmPassword) && errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-2">{errors.confirmPassword}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-[15px] py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-200 disabled:opacity-60 disabled:shadow-none mt-2"
                suppressHydrationWarning
              >
                {submitting ? 'Sending OTP...' : 'Sign Up'}
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
                <Link href="/agent/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline decoration-indigo-200 underline-offset-4 transition-all">
                  Sign up as agent
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