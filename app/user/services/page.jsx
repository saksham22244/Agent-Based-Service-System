'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { toast } from 'react-toastify';

export default function UserServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Application Form Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [dynamicValues, setDynamicValues] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr || JSON.parse(userStr).role !== 'user') {
      router.push('/login');
      return;
    }
    
    fetch('/api/admin/services')
      .then(res => res.json())
      .then(data => {
        // Only show approved and active services
        const validServices = (data.services || []).filter(s => s.approvalStatus === 'approved' && s.active !== false);
        setServices(validServices);
        setLoading(false);
      });

    // Check for search query in URL
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [router]);

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
      const user = JSON.parse(localStorage.getItem('user'));
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('serviceId', selectedService.id);
      
      // The JSON structure of standard text inputs
      formData.append('formData', JSON.stringify(dynamicValues));

      // Append physical files
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
      
      // Immediately hit our real eSewa API
      const esewaRes = await fetch('/api/esewa/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedService.price !== undefined ? selectedService.price : 500, 
          productId: applicationData.id,
          userId: user.id
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Internal Search Bar */}
          <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Filter services by name or description..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="text-gray-400 hover:text-gray-600 text-sm font-medium"
               >
                 Clear
               </button>
             )}
          </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Available Services</h2>
              <p className="mt-2 text-gray-600">Browse fully approved services managed by our verified agents and administrators.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.length === 0 ? (
                <div className="col-span-4 bg-white p-8 rounded-xl border border-gray-200 text-center">
                  <p className="text-gray-500">No active services are available at the moment. Please check back later.</p>
                </div>
              ) : (
                services
                  .filter(s => 
                    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(service => (
                  <div key={service.id} className="bg-white border hover:shadow-xl transition-shadow border-gray-200 rounded-xl overflow-hidden flex flex-col">
                    <div className={`${service.color} ${service.borderColor} p-6 flex flex-col items-center justify-center text-center relative border-b-2`}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-sm mb-4" />
                      ) : (
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                          <span className="text-3xl">{service.icon}</span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                        {service.description || 'No description provided for this service block.'}
                      </p>
                      <div className="text-lg font-bold text-blue-600 mb-2">Rs. {service.price || 0}</div>
                      <button 
                        onClick={() => handleApplyClick(service)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {services.length > 0 && services.filter(s => 
              s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              s.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="bg-white p-12 rounded-xl border border-gray-200 text-center mt-6">
                <p className="text-gray-500">No services match your search: <span className="font-bold">"{searchQuery}"</span></p>
                <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 font-bold hover:underline">Show all services</button>
              </div>
            )}
          </div>
        )}
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
