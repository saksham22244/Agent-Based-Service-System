'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaClipboardList, FaEnvelope, FaFacebookF, FaHistory, FaInstagram, FaLinkedinIn, FaMapMarkerAlt, FaPaperPlane, FaPhoneAlt, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import ConfirmModal from '@/components/ConfirmModal';

export default function UserHomePage() {
  const router = useRouter();
  
  // ==================== STATE MANAGEMENT ====================
  
  // --- User Data State ---
  const [user, setUser] = useState(null);              // Currently logged-in user object
  const [notices, setNotices] = useState([]);         // Notifications for the user
  const [services, setServices] = useState([]);       // Available services (approved only)
  const [requests, setRequests] = useState([]);       // User's application requests
  const [loading, setLoading] = useState(true);       // Loading state for data fetching
  
  // --- Application Form Modal State ---
  const [selectedService, setSelectedService] = useState(null); // Service being applied for
  const [dynamicValues, setDynamicValues] = useState({});       // Values from dynamic form fields
  const [fileUploads, setFileUploads] = useState({});           // Uploaded files for the application
  const [isSubmitting, setIsSubmitting] = useState(false);      // Prevent double submission
  const [confirm, setConfirm] = useState(null);

  // ==================== APPLICATION HANDLERS ====================
  
  /**
   * Opens the application modal for a selected service
   * Resets form state when opening a new application
   * @param {Object} service - The service object to apply for
   */
  const handleApplyClick = (service) => {
    setSelectedService(service);
    setDynamicValues({});      // Clear previous form values
    setFileUploads({});         // Clear previous file uploads
  };

  /**
   * Updates dynamic form field values as user types
   * @param {string} name - Field name/ID from database
   * @param {any} value - New value entered by user
   */
  const handleFieldChange = (name, value) => {
    setDynamicValues(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles file upload changes for file-type form fields
   * @param {string} name - Field name for the file
   * @param {File} file - The uploaded file object
   */
  const handleFileChange = (name, file) => {
    setFileUploads(prev => ({ ...prev, [name]: file }));
  };

  /**
   * Submits the application form and initiates eSewa payment
   * Creates application record first, then redirects to payment gateway
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const userObj = JSON.parse(userStr);
      
      // Build FormData for multipart submission (supports file uploads)
      const formData = new FormData();
      formData.append('userId', userObj.id);
      formData.append('serviceId', selectedService.id);
      
      // Add dynamic form field values (JSON stringified)
      formData.append('formData', JSON.stringify(dynamicValues));

      // Append all uploaded files
      Object.keys(fileUploads).forEach(key => {
        if (fileUploads[key]) {
          formData.append(key, fileUploads[key]);
        }
      });

      // STEP 1: Create application in database
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Submission failed');
      const applicationData = await res.json();
      
      // STEP 2: Initiate eSewa payment for the application
      const esewaRes = await fetch('/api/esewa/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedService.price !== undefined ? selectedService.price : 500, 
          productId: applicationData.id,  // Use application ID as product reference
          userId: userObj.id
        })
      });
      
      const esewaData = await esewaRes.json();
      
      // STEP 3: Redirect to eSewa payment page
      if (esewaData.url) {
        window.location.href = esewaData.url;
      } else {
         throw new Error('Failed to retrieve eSewa payment URL');
      }
      
    } catch (err) {
      toast.error('Failed to submit application or initiate payment. Please check your inputs and try again.');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // ==================== NOTICE DELETION ====================
  
  /**
   * Deletes a notice (user can remove their own notices)
   * @param {string} noticeId - ID of the notice to delete
   */
  const handleDeleteNotice = async (noticeId) => {
    setConfirm({
      message: 'Securely remove this notice?',
      danger: true,
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
          if (res.ok) {
            setNotices(notices.filter(n => n.id !== noticeId));
            toast.success('Notice removed');
          }
        } catch (err) {
          toast.error('Failed to remove notice');
        }
      },
    });
  };

  // ==================== INITIALIZATION ====================
  
  /**
   * Loads user data and dashboard content on component mount
   * Redirects non-users to login and admins to dashboard
   */
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Redirect admins to admin dashboard (not user home)
    if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    
    // PARALLEL FETCHING: Load all dashboard data simultaneously
    Promise.all([
      fetch(`/api/users/${parsedUser.id}/notices`).then(res => res.json()),      // User's notices
      fetch('/api/admin/services').then(res => res.json()),                      // All services
      fetch(`/api/user/applications?userId=${parsedUser.id}`).then(res => res.json()) // User's applications
    ]).then(([noticesData, servicesData, appsData]) => {
      setNotices(noticesData.notices || []);
      
      // Filter services: Only show approved and active services to users
      const activeServices = (servicesData.services || []).filter(s => 
        s.approvalStatus === 'approved' && s.active !== false
      );
      setServices(activeServices);
      setRequests(Array.isArray(appsData) ? appsData : []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    });
  }, [router]);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar hideHome={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ==================== RENDER USER DASHBOARD ====================
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        
        {/* Top Gradient Bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* ===== WELCOME HEADER ===== */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}</h2>
              <p className="mt-2 text-gray-600">Here's an overview of your dashboard and available services.</p>
            </div>
            {/* Top Right Profile Actions (avatar, notifications, logout) */}
            <TopHeader user={user} setUser={setUser} noticesCount={notices.length} hideSearch={true} />
          </div>

          {/* ===== STATISTICS CARDS ===== */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Requests Card */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <p className="text-sm font-medium text-gray-500">My Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">{requests.length}</p>
              <p className="mt-3 text-sm text-gray-500">Total requests submitted so far.</p>
            </div>
            
            {/* Pending Requests Card */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">
                {requests.filter(req => !['work_completed','rejected'].includes(req.status)).length}
              </p>
              <p className="mt-3 text-sm text-gray-500">Requests waiting for payment, review, or processing.</p>
            </div>
            
            {/* Completed Requests Card */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <p className="text-sm font-medium text-gray-500">Completed Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">
                {requests.filter(req => req.status === 'work_completed').length}
              </p>
              <p className="mt-3 text-sm text-gray-500">Requests completed successfully.</p>
            </div>
          </div>

          {/* ===== TWO COLUMN LAYOUT: Main Content + Sidebar ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN (8 cols) - Main Content */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* ===== FEATURED SERVICES SECTION ===== */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Featured Services</h3>
                  <p className="text-sm text-gray-500 mt-1">Most popular services available to request today.</p>
                </div>
                <Link href="/user/services" className="inline-flex items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                  View All Services
                </Link>
              </div>

              {/* Services Grid - Display top 3 services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <p className="text-gray-500">No active services are available at the moment.</p>
                  </div>
                ) : services.slice(0, 3).map(service => (
                  <div key={service.id} className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                    
                    {/* Service Card Header with Color Theme */}
                    <div className={`${service.color || 'bg-blue-50'} ${service.borderColor || 'border-blue-200'} p-6 flex flex-col items-center justify-center text-center relative border-b border-gray-100`}>
                      {/* Service Icon or Image */}
                      {service.imageUrl && !service.imageUrl.startsWith('/uploads/') ? (
                        <img src={service.imageUrl} alt={service.name} className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-sm mb-4" />
                      ) : (
                        <div className="w-16 h-16 bg-white rounded-full flex flex-shrink-0 items-center justify-center shadow-sm mb-4">
                          <span className="text-3xl">{service.icon || '📋'}</span>
                        </div>
                      )}
                      <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                        {service.description || 'No description provided for this service.'}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-blue-600">Rs. {service.price || 0}</span>
                        <button 
                          onClick={() => handleApplyClick(service)}
                          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== RECENT REQUESTS TABLE ===== */}
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">My Recent Requests</h3>
                  <p className="mt-1 text-sm text-gray-500">Latest service requests with status and payment details.</p>
                </div>
                
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Request ID</th>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Service Name</th>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted Date</th>
                        <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.slice(0, 5).map((request) => {
                        const serviceItem = services.find(s => s.id === request.serviceId);
                        
                        // Map status to user-friendly payment display
                        const paymentStatus = request.status === 'pending_payment' ? 'Pending' : 
                                             request.status === 'work_completed' ? 'Paid' : 
                                             request.status === 'approved' ? 'Paid' : 
                                             request.status === 'rejected' ? 'Failed' : 'In Progress';
                        
                        // Map status to user-friendly label
                        const statusLabel = request.status === 'pending_payment' ? 'Waiting for payment' : 
                                           request.status === 'pending_review' ? 'Under review' : 
                                           request.status === 'approved' ? 'Approved' : 
                                           request.status === 'work_completed' ? 'Completed' : 'Pending';
                        
                        return (
                          <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-gray-800">{request.id.slice(-8).toUpperCase()}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{serviceItem?.name || 'Service unavailable'}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{paymentStatus}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString(undefined, { 
                                year: 'numeric', month: 'short', day: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Link href="/user/applications" className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-100">
                                Track
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                            No recent requests available. Start by applying for a service.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (4 cols) - Sidebar Widgets */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* ===== CONTACT INFORMATION WIDGET ===== */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-white">
                  <h3 className="text-xl font-bold text-gray-900">Service Contact Information</h3>
                  <p className="mt-1 text-sm text-gray-500">If you need help, use the contact details below.</p>
                </div>
                <div className="px-6 pb-6 pt-4 space-y-4 text-sm text-gray-700">
                  
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <FaPhoneAlt className="mt-1 text-blue-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Phone</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">053540221</p>
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="mt-1 text-blue-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Email</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">admin@gmail.com</p>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="mt-1 text-blue-600" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Address</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">Kathmandu, Nepal</p>
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Social</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-gray-900">
                      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-gray-700 hover:bg-slate-200 transition">
                        <FaFacebookF className="text-blue-600" /> Facebook
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-gray-700 hover:bg-slate-200 transition">
                        <FaInstagram className="text-pink-500" /> Instagram
                      </a>
                      <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-gray-700 hover:bg-slate-200 transition">
                        <FaLinkedinIn className="text-blue-700" /> LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== QUICK ACTIONS WIDGET ===== */}
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                  <p className="text-sm text-gray-500 mt-1">Jump to common tasks for your account.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/user/services" className="rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FaPaperPlane className="text-blue-600" />
                      Browse Services
                    </div>
                  </Link>
                  <Link href="/user/applications" className="rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FaClipboardList className="text-blue-600" />
                      Track Request
                    </div>
                  </Link>
                  <Link href="/user/history" className="rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FaHistory className="text-blue-600" />
                      View History
                    </div>
                  </Link>
                  <Link href="/user/send-notice" className="rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FaPhoneAlt className="text-blue-600" />
                      Contact Admin
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DYNAMIC APPLICATION FORM MODAL ===== */}
        {/* Modal that appears when user clicks "Apply" on a service */}
        {selectedService && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-xl font-bold">Apply for {selectedService.name}</h3>
                  <p className="text-sm text-blue-100 mt-1">Please fill out all required fields below securely.</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Service Price Display */}
                  <div className="bg-white/20 px-4 py-2 rounded-lg text-white font-bold text-lg border border-white/30 shadow-sm">
                     Rs. {selectedService.price || 0}
                  </div>
                  {/* Close Button */}
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Modal Body - Dynamic Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50">
                
                {/* If service has no dynamic fields */}
                {(!selectedService.formFields || selectedService.formFields.length === 0) ? (
                   <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
                     <p className="text-yellow-800 font-medium">No dynamic fields were configured for this service.</p>
                     <p className="text-sm text-yellow-600 mt-2">You can still submit to reserve an empty slot and generate a transaction ticket.</p>
                   </div>
                ) : (
                  // Render dynamic form fields based on service configuration
                  <div className="space-y-5">
                    {selectedService.formFields.map((field) => (
                      <div key={field.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                         <label className="block text-sm font-bold text-gray-700 mb-1">
                           {field.label} {field.required && <span className="text-red-500">*</span>}
                         </label>
                         
                        {/* Render different input types based on field.type */}
                        {field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'date' ? (
                          <input 
                            type={field.type}
                            required={field.required}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        ) : field.type === 'file' ? (
                          <input 
                            type="file"
                            required={field.required}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(field.name, e.target.files[0]);
                              }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="mt-8">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform focus:scale-95 text-lg"
                  >
                    {isSubmitting ? 'Processing Application...' : 'Continue to Payment ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
      </div>
    </div>
  );
}