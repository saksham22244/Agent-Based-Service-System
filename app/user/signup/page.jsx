'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function UserSignupPage() {
  const router = useRouter();
  
  // ========== FORM STATE ==========
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  // ========== UI STATE ==========
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
  
  // ========== OTP STATE ==========
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // ========== IMAGE URLs ==========
  const heroImageSrc = 'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  const logoSrc = 'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  // ========== EMAIL AVAILABILITY CHECK ==========
  const checkEmailAvailability = async (email) => {
    if (!email || validateField('email', email)) return;

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.exists) setErrors((prev) => ({ ...prev, email: data.error }));
    } catch (err) {
      console.error('Email validation error:', err);
    }
  };

  // ========== FIELD VALIDATION ==========
  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        return '';
      case 'phoneNumber': {
        const digits = value.replace(/\D/g, '');
        if (!digits || digits.length !== 10) return 'Phone number must be exactly 10 digits';
        return '';
      }
      case 'email':
        if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'address':
        if (!value.trim() || value.trim().length < 6) return 'Address must be at least 6 characters';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must include both letters and numbers';
        return '';
      case 'confirmPassword':
        if (value !== form.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  // ========== FULL FORM VALIDATION ==========
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    
    const phoneDigits = form.phoneNumber.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address';
    
    if (!form.address.trim() || form.address.trim().length < 6) newErrors.address = 'Address must be at least 6 characters';
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else {
      if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) newErrors.password = 'Password must include both letters and numbers';
    }
    
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    return newErrors;
  };

  // ========== HANDLE INPUT CHANGE ==========
  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber') value = value.replace(/\D/g, '').slice(0, 10);
    
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

  // ========== HANDLE FORM SUBMISSION ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setTouched({
      name: true, phoneNumber: true, email: true, address: true, password: true, confirmPassword: true
    });
    setError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        if (data.error?.toLowerCase().includes('email already exists')) {
          setErrors((prev) => ({ ...prev, email: data.error }));
        } else {
          setError(data.error || 'Failed to send OTP');
        }
        return;
      }

      setOtpData({ userId: data.userId, email: data.email, type: data.type, formData: form });
      setShowOtpModal(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== VERIFY OTP ==========
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otpData.userId, otp: otp, type: otpData.type }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.error || 'Invalid OTP. Signup cancelled.');
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpData(null);
          setOtp('');
        }, 2000);
        return;
      }

      if (data.success === true && data.status === 'VERIFIED') {
        localStorage.setItem('user', JSON.stringify({
          name: otpData.formData.name,
          email: otpData.formData.email,
          role: 'user',
        }));
        if (data.token) localStorage.setItem('token', data.token);

        setShowOtpModal(false);
        setOtpData(null);
        setOtp('');
        toast.success('Email verified! Account created successfully.');
        
        setTimeout(() => {
          router.push('/user');
        }, 1500);
      } else {
        setOtpError(data.error || 'OTP verification failed. Please try again.');
      }
    } catch (err) {
      setOtpError('An error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ========== HANDLE OTP CHANGE ==========
  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
    setOtpError('');
  };

  // ========== INPUT CLASS STYLING ==========
  const inputClass = (field) => `w-full px-5 py-3.5 rounded-xl border ${errors[field] && (hasSubmitted || touched[field]) ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base`;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        
        {/* ========== LEFT SIDE - HERO IMAGE ========== */}
        <div className="relative bg-gray-200 hidden md:block sticky top-0 h-screen">
          <Image src={heroImageSrc} alt="Signup" fill className="object-cover" priority />
        </div>
        
        {/* ========== RIGHT SIDE - SIGNUP FORM ========== */}
        <div className="flex flex-col justify-center px-6 md:px-10 lg:px-16 py-8 bg-white overflow-y-auto max-h-screen">
          
          {/* ========== LOGO SECTION ========== */}
          <div className="flex justify-center mb-5">
            <div className="h-24 w-24 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-md">
              <Image src={logoSrc} alt="Logo" width={68} height={68} />
            </div>
          </div>
          
          {/* ========== PAGE HEADING ========== */}
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-7">Signup as User</h2>
          
          {/* ========== SIGNUP FORM ========== */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* General Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg mb-2">
                {error}
              </div>
            )}
            
            {/* ===== 1. FULL NAME FIELD ===== */}
            <div className="mb-1">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  setErrors((prev) => ({ ...prev, name: validateField('name', form.name) }));
                }}
                className={inputClass('name')}
              />
              {(hasSubmitted || touched.name) && errors.name && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>
              )}
            </div>
            
            {/* ===== 2. PHONE NUMBER FIELD ===== */}
            <div className="mb-1">
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, phoneNumber: true }));
                  setErrors((prev) => ({ ...prev, phoneNumber: validateField('phoneNumber', form.phoneNumber) }));
                }}
                className={inputClass('phoneNumber')}
                maxLength={10}
              />
              {(hasSubmitted || touched.phoneNumber) && errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.phoneNumber}</p>
              )}
            </div>
            
            {/* ===== 3. EMAIL FIELD ===== */}
            <div className="mb-1">
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={async () => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  const err = validateField('email', form.email);
                  setErrors((prev) => ({ ...prev, email: err }));
                  if (!err) await checkEmailAvailability(form.email);
                }}
                className={inputClass('email')}
              />
              {(hasSubmitted || touched.email) && errors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
              )}
            </div>
            
            {/* ===== 4. ADDRESS FIELD ===== */}
            <div className="mb-1">
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={handleChange('address')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, address: true }));
                  setErrors((prev) => ({ ...prev, address: validateField('address', form.address) }));
                }}
                className={inputClass('address')}
              />
              {(hasSubmitted || touched.address) && errors.address && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.address}</p>
              )}
            </div>
            
            {/* ===== 5. PASSWORD FIELD ===== */}
            <div className="mb-1">
              <input
                type="password"
                placeholder="Password (6+ chars, letters & numbers)"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }));
                  setErrors((prev) => ({ ...prev, password: validateField('password', form.password) }));
                }}
                className={inputClass('password')}
              />
              {(hasSubmitted || touched.password) && errors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
              )}
            </div>
            
            {/* ===== 6. CONFIRM PASSWORD FIELD ===== */}
            <div className="mb-2">
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', form.confirmPassword) }));
                }}
                className={inputClass('confirmPassword')}
              />
              {(hasSubmitted || touched.confirmPassword) && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>
              )}
            </div>
            
            {/* ===== 7. SUBMIT BUTTON ===== */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60 mt-3"
            >
              {submitting ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>
          
          {/* ========== DIVIDER ========== */}
          <div className="my-6 flex items-center">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-4 text-xs text-gray-500 font-medium">Or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          
          {/* ========== LINKS SECTION ========== */}
          <div className="text-center space-y-2">
            <p className="text-gray-700 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                Login now
              </Link>
            </p>
            <p className="text-sm">
              <Link href="/agent/signup" className="text-indigo-600 font-bold hover:underline">
                Sign up as agent →
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* ========== OTP VERIFICATION MODAL ========== */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Email</h2>
            <p className="text-gray-600 text-sm mb-4">
              OTP sent to <strong className="text-gray-900">{otpData?.email}</strong>
            </p>
            
            {otpError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                {otpError}
              </div>
            )}
            
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-2xl font-bold tracking-[0.3em] border-2 border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpData(null);
                  setOtp('');
                  setOtpError('');
                }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-medium text-sm"
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