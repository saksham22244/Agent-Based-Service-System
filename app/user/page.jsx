'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

export default function UserHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [services, setServices] = useState([]);
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
      fetch('/api/admin/services').then(res => res.json())
    ]).then(([noticesData, servicesData]) => {
      setNotices(noticesData.notices || []);
      const activeServices = (servicesData.services || []).filter(s => s.approvalStatus === 'approved' && s.active !== false);
      
      setServices(activeServices);
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
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Services taking up 3 columns */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Featured Services</h3>
                <Link href="/user/services" className="text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                  View All Services
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {services.length === 0 ? (
                   <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center">
                     <p className="text-gray-500">No active services are available at the moment.</p>
                   </div>
                 ) : services.slice(0, 6).map(service => (
                   <div key={service.id} className="bg-white border hover:shadow-xl transition-shadow border-gray-200 rounded-xl overflow-hidden flex flex-col">
                     <div className={`${service.color || 'bg-blue-50'} ${service.borderColor || 'border-blue-200'} p-6 flex flex-col items-center justify-center text-center relative border-b-2`}>
                       {service.imageUrl ? (
                         <img src={service.imageUrl} alt={service.name} className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-sm mb-4" />
                       ) : (
                         <div className="w-16 h-16 bg-white rounded-full flex flex-shrink-0 items-center justify-center shadow-sm mb-4">
                           <span className="text-3xl">{service.icon || '📋'}</span>
                         </div>
                       )}
                       <h3 className="text-xl font-bold text-gray-900 leading-tight">{service.name}</h3>
                     </div>
                     <div className="p-5 flex-1 flex flex-col">
                       <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                         {service.description || 'No description provided for this service block.'}
                       </p>
                       <div className="text-lg font-bold text-blue-600 mb-2">Rs. {service.price || 0}</div>
                       <button 
                         onClick={() => handleApplyClick(service)}
                         className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                       >
                         Apply Now
                       </button>
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Notices taking up 1 column */}
            <div className="lg:col-span-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Notices</h3>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col max-h-[600px]">
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                   {notices.length === 0 ? (
                     <div className="text-center py-10">
                       <FaBell className="text-gray-300 text-4xl mx-auto mb-3" />
                       <p className="text-sm text-gray-500 italic">No new notices at the moment.</p>
                     </div>
                   ) : notices.map(n => (
                     <div key={n.id} className="border-b border-gray-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
                            <FaBell size={18} />
                          </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-900 leading-tight">{n.title}</p>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteNotice(n.id);
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Discard"
                              >
                                <FaTrashAlt size={12} />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1.5 line-clamp-3">{n.message}</p>
                          </div>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center shrink-0">
                  <Link href="/user/notices" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                    View All Notices
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
