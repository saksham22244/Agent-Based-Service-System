'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaClipboardList, FaHistory, FaPaperPlane, FaPhoneAlt, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

export default function UserHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Application Form Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [dynamicValues, setDynamicValues] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyClick = (service) => {
    setSelectedService(service);
    setDynamicValues({});
    setFileUploads({});
  };

  const handleFieldChange = (name, value) => {
    setDynamicValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    setFileUploads(prev => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const userStr = localStorage.getItem('user');
      const userObj = JSON.parse(userStr);
      const formData = new FormData();
      formData.append('userId', userObj.id);
      formData.append('serviceId', selectedService.id);
      
      formData.append('formData', JSON.stringify(dynamicValues));

      Object.keys(fileUploads).forEach(key => {
        if (fileUploads[key]) {
          formData.append(key, fileUploads[key]);
        }
      });

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Submission failed');
      const applicationData = await res.json();
      
      const esewaRes = await fetch('/api/esewa/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedService.price !== undefined ? selectedService.price : 500, 
          productId: applicationData.id,
          userId: userObj.id
        })
      });
      
      const esewaData = await esewaRes.json();
      
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

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Securely remove this notice?')) return;
    try {
      const res = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== noticeId));
        toast.success('Notice removed');
      }
    } catch (err) {
      toast.error('Failed to remove notice');
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    
    // Fetch data for the dashboard
    Promise.all([
      fetch(`/api/users/${parsedUser.id}/notices`).then(res => res.json()),
      fetch('/api/admin/services').then(res => res.json()),
      fetch(`/api/user/applications?userId=${parsedUser.id}`).then(res => res.json())
    ]).then(([noticesData, servicesData, appsData]) => {
      setNotices(noticesData.notices || []);
      const activeServices = (servicesData.services || []).filter(s => s.approvalStatus === 'approved' && s.active !== false);
      setServices(activeServices);
      setRequests(Array.isArray(appsData) ? appsData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}</h2>
              <p className="mt-2 text-gray-600">Here's an overview of your dashboard and available services.</p>
            </div>
            {/* Top Right Profile Actions */}
            <TopHeader user={user} setUser={setUser} noticesCount={notices.length} hideSearch={true} />
          </div>

          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5">
              <p className="text-sm font-medium text-gray-500">My Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">{requests.length}</p>
              <p className="mt-2 text-sm text-gray-500">Total requests submitted so far.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5">
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">{requests.filter(req => !['work_completed','rejected'].includes(req.status)).length}</p>
              <p className="mt-2 text-sm text-gray-500">Requests still awaiting review, payment or approval.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5">
              <p className="text-sm font-medium text-gray-500">Completed Requests</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">{requests.filter(req => req.status === 'work_completed').length}</p>
              <p className="mt-2 text-sm text-gray-500">Requests marked complete by the support team.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Featured Services</h3>
                  <p className="text-sm text-gray-500 mt-1">Most popular services available to request today.</p>
                </div>
                <Link href="/user/services" className="inline-flex items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                  View All Services
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-sm">
                    <p className="text-gray-500">No active services are available at the moment.</p>
                  </div>
                ) : services.slice(0, 3).map(service => (
                  <div key={service.id} className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                    <div className={`${service.color || 'bg-blue-50'} ${service.borderColor || 'border-blue-200'} p-6 flex flex-col items-center justify-center text-center relative border-b border-gray-100`}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-sm mb-4" />
                      ) : (
                        <div className="w-16 h-16 bg-white rounded-full flex flex-shrink-0 items-center justify-center shadow-sm mb-4">
                          <span className="text-3xl">{service.icon || '📋'}</span>
                        </div>
                      )}
                      <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                    </div>
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

              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">My Recent Requests</h3>
                  <p className="mt-1 text-sm text-gray-500">Latest service requests with status and payment details.</p>
                </div>
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
                        const paymentStatus = request.status === 'pending_payment' ? 'Pending' : request.status === 'work_completed' ? 'Paid' : request.status === 'approved' ? 'Paid' : request.status === 'rejected' ? 'Failed' : 'In Progress';
                        const statusLabel = request.status === 'pending_payment' ? 'Waiting for payment' : request.status === 'pending_review' ? 'Under review' : request.status === 'approved' ? 'Approved' : request.status === 'work_completed' ? 'Completed' : 'Pending';
                        return (
                          <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-gray-800">{request.id.slice(-8).toUpperCase()}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{serviceItem?.name || 'Service unavailable'}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">{statusLabel}</span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{paymentStatus}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{new Date(request.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td className="px-4 py-4 text-sm">
                              <Link href="/user/applications" className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
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

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">Notices</h3>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[420px] space-y-4">
                  {notices.length === 0 ? (
                    <div className="text-center py-12">
                      <FaBell className="mx-auto text-4xl text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 italic">No new notices at the moment.</p>
                    </div>
                  ) : notices.map(n => (
                    <div key={n.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                          <p className="mt-2 text-sm text-gray-600">{n.message}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteNotice(n.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove notice"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                  <Link href="/user/notices" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                    View All Notices
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                  <p className="text-sm text-gray-500 mt-1">Jump to common tasks for your account.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/user/services" className="rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FaPaperPlane className="text-blue-600" />
                      Apply for Service
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

        {/* Dynamic Application Form Modal */}
        {selectedService && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-xl font-bold">Apply for {selectedService.name}</h3>
                  <p className="text-sm text-blue-100 mt-1">Please fill out all required fields below securely.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 px-4 py-2 rounded-lg text-white font-bold text-lg border border-white/30 shadow-sm">
                     Rs. {selectedService.price || 0}
                  </div>
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50">
                 {(!selectedService.formFields || selectedService.formFields.length === 0) ? (
                   <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
                     <p className="text-yellow-800 font-medium">No dynamic fields were configured for this service.</p>
                     <p className="text-sm text-yellow-600 mt-2">You can still submit to reserve an empty slot and generate a transaction ticket.</p>
                   </div>
                 ) : (
                   <div className="space-y-5">
                     {selectedService.formFields.map((field) => (
                       <div key={field.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
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

      </div>
    </div>
  );
}
