'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function UserSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', phoneNumber: '', email: '', address: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const heroImageSrc = 'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  const logoSrc = 'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const onlyDigits = (str) => str.replace(/\D/g, '');

  const validate = {
    name: (v) => !v ? 'Full name is required' : '',
    phone: (v) => !v ? 'Phone number is required' : onlyDigits(v).length !== 10 ? 'Exactly 10 digits' : '',
    email: (v) => !v ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email' : '',
    address: (v) => !v ? 'Address is required' : '',
    password: (v) => {
      if (!v) return 'Password is required';
      if (v.length < 6) return 'Min 6 characters';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Must include letters and numbers';
      return '';
    },
    confirm: (v) => {
      if (!v) return 'Confirm password';
      if (v !== form.password) return 'Passwords do not match';
      return '';
    },
  };

  const handleChange = (field, validator) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber') value = onlyDigits(value).slice(0, 10);
    setForm({ ...form, [field]: value });
    const error = validator(value);
    if (error) setErrors({ ...errors, [field]: error });
    else { const newErrors = { ...errors }; delete newErrors[field]; setErrors(newErrors); }
    
    if (field === 'password' && form.confirmPassword) {
      const confirmError = validate.confirm(form.confirmPassword);
      if (confirmError) setErrors({ ...errors, confirmPassword: confirmError });
      else { const newErrors = { ...errors }; delete newErrors.confirmPassword; setErrors(newErrors); }
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, confirmPassword: value });
    const error = validate.confirm(value);
    if (error) setErrors({ ...errors, confirmPassword: error });
    else { const newErrors = { ...errors }; delete newErrors.confirmPassword; setErrors(newErrors); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    newErrors.name = validate.name(form.name);
    newErrors.phone = validate.phone(form.phoneNumber);
    newErrors.email = validate.email(form.email);
    newErrors.address = validate.address(form.address);
    newErrors.password = validate.password(form.password);
    newErrors.confirm = validate.confirm(form.confirmPassword);
    
    Object.keys(newErrors).forEach(k => { if (!newErrors[k]) delete newErrors[k]; });
    if (Object.keys(newErrors).length) return setErrors(newErrors);
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'user' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpData({ userId: data.userId, email: data.email, type: data.type, formData: form });
      setShowOtpModal(true);
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return setOtpError('Enter 6-digit OTP');
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otpData.userId, otp: otpValue, type: otpData.type })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Use the full user object returned by the API (includes `id`) and token when available
        if (data.user) {
          if (data.token) localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Fallback to previous minimal object
          localStorage.setItem('user', JSON.stringify({ name: otpData.formData.name, email: otpData.formData.email, role: 'user' }));
        }
        toast.success('Account created!');
        router.push('/user');
      } else {
        setOtpError(data.error || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
      }
    } catch { 
      setOtpError('Verification failed');
      setOtp(['', '', '', '', '', '']);
    }
    finally { setVerifying(false); }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');
    
    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle key down for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace when current is empty
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const inputClass = (field) => `w-full px-4 py-3 rounded-xl border ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        
        {/* Left Image */}
        <div className="relative bg-gray-200 hidden md:block sticky top-0 h-screen">
          <Image src={heroImageSrc} alt="Signup" fill className="object-cover" priority />
        </div>
        
        {/* Right Form */}
        <div className="flex flex-col justify-center px-6 md:px-12 py-8 bg-white overflow-y-auto">
          
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow">
              <Image src={logoSrc} alt="Logo" width={60} height={60} />
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name */}
            <div>
              <input type="text" placeholder="Full Name" value={form.name} onChange={handleChange('name', validate.name)} className={inputClass('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            {/* Phone Number */}
            <div>
              <input type="tel" placeholder="Phone Number (10 digits)" value={form.phoneNumber} onChange={handleChange('phoneNumber', validate.phone)} maxLength={10} className={inputClass('phone')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            
            {/* Email */}
            <div>
              <input type="email" placeholder="Email Address" value={form.email} onChange={handleChange('email', validate.email)} className={inputClass('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            {/* Address */}
            <div>
              <input type="text" placeholder="Address" value={form.address} onChange={handleChange('address', validate.address)} className={inputClass('address')} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            
            {/* Password */}
            <div>
              <input type="password" placeholder="Password" value={form.password} onChange={handleChange('password', validate.password)} className={inputClass('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            {/* Confirm Password */}
            <div>
              <input type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleConfirmChange} className={inputClass('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            
            {/* Submit Button */}
            <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60 mt-4">
              {submitting ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-4 text-xs text-gray-500">Or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          
          {/* Links */}
          <div className="text-center space-y-2">
            <p className="font-bold text-gray-800">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                Login now
              </Link>
            </p>
            <p className="font-bold text-gray-800">
              <Link href="/agent/signup" className="text-indigo-600 font-bold hover:underline">
                Sign up as agent →
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Fixed OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Email</h2>
            <p className="text-gray-600 text-sm mb-4">
              OTP sent to <strong className="text-gray-900">{otpData?.email}</strong>
            </p>
            
            {otpError && (
              <p className="text-red-600 text-sm mb-3 font-medium">{otpError}</p>
            )}
            
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-2 mb-5">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpData(null);
                  setOtp(['', '', '', '', '', '']);
                  setOtpError('');
                }} 
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifyOtp} 
                disabled={verifying || otp.join('').length !== 6} 
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium"
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