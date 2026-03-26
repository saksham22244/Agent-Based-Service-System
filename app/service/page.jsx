'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { FaPlus, FaPen, FaBell, FaEnvelope, FaCertificate, FaUserCheck, FaTimes, FaCheck, FaPalette, FaIcons, FaImage, FaListAlt, FaTrash } from 'react-icons/fa';

export default function ServicePage() {
  const [services, setServices] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newService, setNewService] = useState({ 
    name: '', 
    icon: '📋',
    color: 'bg-blue-50',
    borderColor: 'border-blue-200'
  });
  const [imageFile, setImageFile] = useState(null);
  const [formFields, setFormFields] = useState([]);
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddField = () => {
    setFormFields([...formFields, { id: Date.now().toString(), name: '', label: '', type: 'text', required: true }]);
  };

  const handleRemoveField = (id) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id, key, value) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // Fetch services from backend on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'admin');
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
    fetchServices();
  }, []);

  const handleApproveService = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this service as ${status}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status} service`);
      }

      setServices(services.map(s => s.id === id ? { ...s, approvalStatus: status } : s));
      alert(`Service ${status} successfully!`);
    } catch (err) {
      console.error('Status update err:', err);
      alert('Failed to update service status.');
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/services');
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      alert('Please enter a service name');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('name', newService.name);
      formData.append('icon', newService.icon);
      formData.append('color', newService.color);
      formData.append('borderColor', newService.borderColor);
      formData.append('active', 'true');
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        formData.append('createdBy', userObj.id);
        formData.append('creatorRole', userObj.role);
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      formData.append('formFields', JSON.stringify(formFields));

      const response = await fetch('/api/admin/services', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create service');
      }

      const createdService = await response.json();
      
      // Add the new service to the list
      setServices([...services, createdService]);
      
      // Reset form
      setNewService({ 
        name: '', 
        icon: '📋',
        color: 'bg-blue-50',
        borderColor: 'border-blue-200'
      });
      setImageFile(null);
      setFormFields([]);
      setIsAddingService(false);
      
      alert('Service created successfully!');
    } catch (err) {
      console.error('Error creating service:', err);
      setError(err.message || 'Failed to create service. Please try again.');
      alert(err.message || 'Failed to create service. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveService = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      // Remove the service from the list
      setServices(services.filter(service => service.id !== id));
      alert('Service deleted successfully!');
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message || 'Failed to delete service. Please try again.');
      alert(err.message || 'Failed to delete service. Please try again.');
    }
  };

  const availableIcons = [
    { value: '📋', label: 'Form' },
    { value: '📝', label: 'Document' },
    { value: '👶', label: 'Birth' },
    { value: '📜', label: 'Certificate' },
    { value: '🏠', label: 'Address' },
    { value: '💰', label: 'Income' },
    { value: '💼', label: 'Employment' },
    { value: '🎓', label: 'Education' },
    { value: '🏥', label: 'Medical' },
    { value: '⚖️', label: 'Legal' },
    { value: '🔒', label: 'Security' },
    { value: '📊', label: 'Report' },
  ];

  const availableColors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', name: 'Blue' },
    { bg: 'bg-green-50', border: 'border-green-200', name: 'Green' },
    { bg: 'bg-red-50', border: 'border-red-200', name: 'Red' },
    { bg: 'bg-yellow-50', border: 'border-yellow-200', name: 'Yellow' },
    { bg: 'bg-purple-50', border: 'border-purple-200', name: 'Purple' },
    { bg: 'bg-pink-50', border: 'border-pink-200', name: 'Pink' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="text-blue-600">
                <FaPen className="text-xl md:text-2xl" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800">AGENT BASED</h1>
                <p className="text-xs md:text-sm text-gray-600">SERVICE MANAGEMENT</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-6">
              <button className="flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                <FaBell className="text-sm" />
                <span className="font-medium">NOTICE</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm">
                <FaEnvelope className="text-sm" />
                <span className="font-medium">REQUEST</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Services</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage and organize all available services</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading services...</div>
            </div>
          ) : (
            <>
              {/* Services Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {services.map((service) => (
              <div 
                key={service.id}
                className={`relative group ${service.color} ${service.borderColor} border-2 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[220px] hover:shadow-lg transition-all duration-300`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveService(service.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs md:text-base"
                  title="Remove Service"
                >
                  ×
                </button>
                
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 md:mb-4">
                  <span className="text-2xl md:text-3xl">{service.icon}</span>
                </div>
                
                <h3 className="text-base md:text-xl font-bold text-gray-800 whitespace-pre-line leading-tight">
                  {service.name}
                </h3>
                
                <div className="mt-3 md:mt-4 flex flex-col items-center gap-2">
                  <span className="px-2 py-1 md:px-3 md:py-1 bg-white/70 text-xs font-semibold text-gray-700 rounded-full border border-gray-300">
                    SERVICE
                  </span>
                  
                  {service.approvalStatus === 'pending' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] md:text-xs font-bold rounded-full border border-yellow-200 uppercase tracking-widest whitespace-nowrap">
                      Pending Approval
                    </span>
                  )}
                  {service.approvalStatus === 'rejected' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-[10px] md:text-xs font-bold rounded-full border border-red-200 uppercase tracking-widest whitespace-nowrap">
                      Rejected
                    </span>
                  )}
                </div>

                {service.approvalStatus === 'pending' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="absolute inset-0 bg-black/70 rounded-xl md:rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveService(service.id, 'approved');
                      }}
                      className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 w-3/4"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveService(service.id, 'rejected');
                      }}
                      className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 w-3/4"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add Service Card */}
            <div 
              onClick={() => setIsAddingService(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[220px] hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 md:mb-4">
                <FaPlus className="text-xl md:text-3xl text-gray-400 group-hover:text-blue-500" />
              </div>
              
              <h3 className="text-base md:text-xl font-bold text-gray-600 group-hover:text-blue-600">
                ADD<br />SERVICES
              </h3>
              
              <div className="mt-3 md:mt-4">
                <span className="px-2 py-1 md:px-3 md:py-1 bg-gray-100 text-xs font-semibold text-gray-600 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600">
                  CLICK TO ADD
                </span>
              </div>
            </div>
          </div>

              {/* Stats Section */}
              <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Services</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FaCertificate className="text-blue-500 text-base md:text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Active Services</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {services.filter(s => s.active !== false).length}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <FaUserCheck className="text-green-500 text-base md:text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Categories</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">6</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <FaPen className="text-purple-500 text-base md:text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Last Updated</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">Today</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                  <FaBell className="text-yellow-500 text-base md:text-xl" />
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Optimized Modal */}
      {isAddingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Create New Service</h2>
                  <p className="text-blue-100">Create a new service for users</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddingService(false);
                    setNewService({ 
                      name: '', 
                      icon: '📋',
                      color: 'bg-blue-50',
                      borderColor: 'border-blue-200'
                    });
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Modal Body - Two Column Layout */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Preview */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaCertificate className="mr-2 text-blue-500" />
                      Service Preview
                    </h3>
                    <div className={`${newService.color} ${newService.borderColor} border-2 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]`}>
                      <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mb-6">
                        <span className="text-4xl">{newService.icon}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 whitespace-pre-line leading-tight min-h-[80px] flex items-center justify-center">
                        {newService.name.toUpperCase() || 'NEW\nSERVICE'}
                      </h3>
                      {imageFile && (
                        <div className="mt-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">+ Custom Image</span>
                        </div>
                      )}
                      <div className="mt-6 flex flex-col gap-2 w-full text-center">
                        <span className="px-4 py-2 bg-white text-sm font-semibold text-gray-700 rounded-full border border-gray-300 w-max mx-auto">
                          SERVICE
                        </span>
                        {formFields.length > 0 && (
                          <span className="text-xs text-gray-500 font-medium mt-1">{formFields.length} Dynamic Fields Included</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-medium text-gray-700 mb-3">Preview Note</h4>
                    <p className="text-sm text-gray-600">
                      This is how your service will appear to users. Long service names will automatically split into two lines for better readability.
                    </p>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div className="space-y-6">
                  {/* Service Name */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="e.g., Birth Certificate"
                          autoFocus
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaPen />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Enter the service name. It will be converted to uppercase.
                      </p>
                    </div>

                    {/* Icon Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FaIcons className="mr-2 text-blue-500" />
                        Select Icon
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {availableIcons.map((iconObj) => (
                          <button
                            key={iconObj.value}
                            type="button"
                            onClick={() => setNewService({ ...newService, icon: iconObj.value })}
                            className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 ${
                              newService.icon === iconObj.value 
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } transition-all`}
                          >
                            <span className="text-2xl mb-1">{iconObj.value}</span>
                            <span className="text-xs text-gray-600 truncate w-full">{iconObj.label}</span>
                            {newService.icon === iconObj.value && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <FaCheck className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="mb-6 border border-gray-200 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FaImage className="mr-2 text-blue-500" />
                        Service Thumbnail (Optional)
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    {/* Dynamic Form Fields */}
                    <div className="mb-6 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                          <FaListAlt className="mr-2 text-blue-500" />
                          Dynamic User Form Fields
                        </label>
                        <button type="button" onClick={handleAddField} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 font-semibold shadow-sm transition">
                          + Add Field
                        </button>
                      </div>
                      
                      {formFields.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                          <p className="text-xs text-gray-500">No dynamic fields. Click '+ Add Field' to build your form.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {formFields.map((field, index) => (
                            <div key={field.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative group transition-all">
                              <button type="button" onClick={() => handleRemoveField(field.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1 bg-white rounded transition shadow-sm">
                                <FaTrash size={12} />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-3 mb-2 pr-8">
                                <div>
                                  <label className="text-xs font-semibold text-gray-600 block">Field Label</label>
                                  <input type="text" placeholder="e.g. Applicant Name" value={field.label} onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)} className="w-full mt-1 border border-gray-300 px-2 py-1.5 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500" required />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-600 block">Database ID (e.g. fullName)</label>
                                  <input type="text" placeholder="e.g. fullName" value={field.name} onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)} className="w-full mt-1 border border-gray-300 px-2 py-1.5 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500" required />
                                </div>
                              </div>
                              <div className="flex gap-4 items-center mt-3 bg-white p-2 rounded border border-gray-100">
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-gray-600 block">Input Type</label>
                                  <select value={field.type} onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)} className="w-full mt-1 border border-gray-300 px-2 py-1 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="text">Short Text</option>
                                    <option value="email">Email</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date picker</option>
                                    <option value="file">File Upload (Image/PDF)</option>
                                  </select>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer mt-5">
                                  <input type="checkbox" checked={field.required} onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                  Required
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FaPalette className="mr-2 text-blue-500" />
                        Select Theme Color
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {availableColors.map((colorObj) => (
                          <button
                            key={colorObj.bg}
                            type="button"
                            onClick={() => setNewService({ 
                              ...newService, 
                              color: colorObj.bg,
                              borderColor: colorObj.border
                            })}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center ${
                              newService.color === colorObj.bg 
                                ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-300' 
                                : 'border-gray-200 hover:border-gray-300'
                            } transition-all`}
                          >
                            <div className={`w-12 h-12 rounded-lg ${colorObj.bg} ${colorObj.border} border mb-2`}></div>
                            <span className="text-xs font-medium text-gray-700">{colorObj.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Existing Services Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h4 className="font-medium text-gray-700 mb-3">Existing Services</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {services.slice(0, 2).map((service) => (
                        <div 
                          key={service.id}
                          className={`${service.color} ${service.borderColor} border rounded-lg p-3 flex items-center space-x-3`}
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <span className="text-lg">{service.icon}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {service.name.split('\n')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => {
                      setIsAddingService(false);
                      setNewService({ 
                        name: '', 
                        icon: '📋',
                        color: 'bg-blue-50',
                        borderColor: 'border-blue-200'
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddService}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPlus className="mr-2" />
                    {isSaving ? 'Creating...' : 'Create Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}