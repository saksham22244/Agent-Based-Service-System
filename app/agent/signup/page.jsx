'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function AgentSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    paymentDetails: '',
    password: '',
    confirmPassword: '',
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const heroImageSrc = 'https://drive.google.com/uc?export=view&id=12ejbUJxqDC8cGp3t9ZJriA42Yh1j7E0K';
  const logoSrc = 'https://drive.google.com/uc?export=view&id=1Dq2CNVPgjj7-5si_GoT7xkEpXYwT57gy';

  const onlyDigits = (str) => str.replace(/\D/g, '');

  const validate = {
    name: (v) => !v ? 'Full name is required' : '',
    phone: (v) => !v ? 'Phone number is required' : onlyDigits(v).length !== 10 ? 'Phone number must be exactly 10 digits' : '',
    email: (v) => !v ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : '',
    address: (v) => !v ? 'Address is required' : '',
    payment: (v) => !v ? 'eSewa number is required' : onlyDigits(v).length !== 10 ? 'eSewa number must be exactly 10 digits' : '',
    password: (v) => {
      if (!v) return 'Password is required';
      if (v.length < 6) return 'Password must be at least 6 characters';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Password must include letters and numbers';
      return '';
    },
    confirmPassword: (v) => {
      if (!v) return 'Please confirm your password';
      if (v !== formData.password) return 'Passwords do not match';
      return '';
    },
    photo: (v) => !v ? 'Profile photo is required' : '',
  };

  const handleChange = (field, validator) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber' || field === 'paymentDetails') {
      value = onlyDigits(value).slice(0, 10);
    }
    setFormData({ ...formData, [field]: value });
    
    const error = validator(value);
    if (error) setErrors({ ...errors, [field]: error });
    else { const newErrors = { ...errors }; delete newErrors[field]; setErrors(newErrors); }
    
    if (field === 'password' && formData.confirmPassword) {
      const confirmError = validate.confirmPassword(formData.confirmPassword);
      if (confirmError) setErrors({ ...errors, confirmPassword: confirmError });
      else { const newErrors = { ...errors }; delete newErrors.confirmPassword; setErrors(newErrors); }
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    const error = validate.confirmPassword(value);
    if (error) setErrors({ ...errors, confirmPassword: error });
    else { const newErrors = { ...errors }; delete newErrors.confirmPassword; setErrors(newErrors); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, photo: file });
    const error = file ? '' : 'Profile photo is required';
    if (error) setErrors({ ...errors, photo: error });
    else { const newErrors = { ...errors }; delete newErrors.photo; setErrors(newErrors); }
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    newErrors.name = validate.name(formData.name);
    newErrors.phone = validate.phone(formData.phoneNumber);
    newErrors.email = validate.email(formData.email);
    newErrors.address = validate.address(formData.address);
    newErrors.payment = validate.payment(formData.paymentDetails);
    newErrors.password = validate.password(formData.password);
    newErrors.confirmPassword = validate.confirmPassword(formData.confirmPassword);
    newErrors.photo = validate.photo(formData.photo);
    
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix all errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      if (formData.email === 'admin@example.com') {
        toast.error('Admin account cannot be created through agent signup');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('paymentDetails', formData.paymentDetails);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('photo', formData.photo);

      const agentResponse = await fetch('/api/agents', {
        method: 'POST',
        body: formDataToSend,
      });

      const agentData = await agentResponse.json();

      if (!agentResponse.ok) {
        if (agentData.error?.includes('email already exists')) {
          setErrors({ ...errors, email: 'Email already exists. Please use a different email or login.' });
          toast.error('Email already exists');
        } else {
          throw new Error(agentData.error || 'Agent signup failed');
        }
        setLoading(false);
        return;
      }

      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: agentData.id,
          email: formData.email,
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          type: 'agent',
        }),
      });

      const otpResponseData = await otpResponse.json();

      if (otpResponse.ok) {
        setOtpData({
          userId: agentData.id,
          email: formData.email,
          type: 'agent',
        });
        setShowOtpModal(true);
        toast.success('OTP sent to your email!');
      } else {
        throw new Error(otpResponseData.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error(err.message);
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpData.userId,
          otp: otp,
          type: otpData.type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(data.error || 'Invalid OTP. Signup cancelled.');
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpData(null);
          setOtp('');
        }, 2000);
        return;
      }

      localStorage.setItem('user', JSON.stringify({
        name: formData.name,
        email: formData.email,
        role: 'agent',
      }));

      toast.success('Email verified! Pending admin approval.');
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
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

  const inputClass = (field) => `w-full px-4 py-2.5 rounded-lg border ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm`;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left Side - Image */}
        <div className="relative bg-gray-200 hidden md:block sticky top-0 h-screen">
          <Image src={heroImageSrc} alt="Agent Signup" fill className="object-cover" priority />
        </div>
        
        {/* Right Side - Form with scrolling */}
        <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-8 bg-white overflow-y-auto max-h-screen">
          
          {/* Logo - Smaller */}
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-md">
              <Image src={logoSrc} alt="Logo" width={56} height={56} />
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Signup as Agent</h2>
          
          {errors.general && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <input type="text" placeholder="Full Name" value={formData.name} onChange={handleChange('name', validate.name)} className={inputClass('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            {/* Phone Number */}
            <div>
              <input type="tel" placeholder="Phone Number (10 digits)" value={formData.phoneNumber} onChange={handleChange('phoneNumber', validate.phone)} maxLength={10} className={inputClass('phoneNumber')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            
            {/* Email */}
            <div>
              <input type="email" placeholder="Email Address" value={formData.email} onChange={handleChange('email', validate.email)} className={inputClass('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            {/* Address */}
            <div>
              <input type="text" placeholder="Address" value={formData.address} onChange={handleChange('address', validate.address)} className={inputClass('address')} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            
            {/* eSewa Number */}
            <div>
              <input type="tel" placeholder="eSewa Number (10 digits)" value={formData.paymentDetails} onChange={handleChange('paymentDetails', validate.payment)} maxLength={10} className={inputClass('paymentDetails')} />
              {errors.payment && <p className="text-red-500 text-xs mt-1">{errors.payment}</p>}
            </div>
            
            {/* Password */}
            <div>
              <input type="password" placeholder="Password (6+ chars, letters & numbers)" value={formData.password} onChange={handleChange('password', validate.password)} className={inputClass('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            {/* Confirm Password */}
            <div>
              <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleConfirmChange} className={inputClass('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            
            {/* Photo */}
            <div>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className={inputClass('photo')} />
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
              {photoPreview && (
                <div className="mt-2">
                  <img src={photoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60 mt-2">
              {loading ? 'Signing up...' : 'Sign Up as Agent'}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-4 text-xs text-gray-500 font-medium">Or</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          
          {/* Links */}
          <div className="text-center space-y-2 text-sm">
            <p className="text-gray-700">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                Login now
              </Link>
            </p>
            <p>
              <Link href="/user/signup" className="text-indigo-600 font-bold hover:underline">
                Sign up as user →
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <h2 className="text-xl font-bold mb-2">Verify Email</h2>
            <p className="text-gray-600 text-sm mb-4">OTP sent to <strong>{otpData?.email}</strong></p>
            {otpError && <p className="text-red-500 text-xs mb-3">{otpError}</p>}
            <input type="text" value={otp} onChange={handleOtpChange} placeholder="000000" maxLength={6} className="w-full text-center text-2xl font-bold tracking-[0.3em] border-2 rounded-lg p-2 mb-4 focus:outline-none focus:border-indigo-500" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowOtpModal(false)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleVerifyOtp} disabled={verifying || otp.length !== 6} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}